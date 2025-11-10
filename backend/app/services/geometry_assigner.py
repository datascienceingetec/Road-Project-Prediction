import os
import json
import tempfile
from werkzeug.utils import secure_filename
from shapely.geometry import shape as shapely_shape
from app.services.geometry_processor import GeometryProcessor
from app.models import UnidadFuncional, db
import re

class GeometryAssigner:
    """
    Servicio utilitario para asignar geometrías desde archivos
    a unidades funcionales individuales o a todas las del proyecto.
    """

    # ------------------------------
    # Validación y extracción común
    # ------------------------------
    @staticmethod
    def extract_file_features(uploaded_file):
        """Valida y extrae geometrías desde un archivo subido (KML, SHP, GeoJSON)."""
        if not uploaded_file or not uploaded_file.filename:
            raise ValueError("Archivo vacío o no proporcionado")

        filename = secure_filename(uploaded_file.filename)
        uploaded_file.seek(0, os.SEEK_END)
        size = uploaded_file.tell()
        uploaded_file.seek(0)

        is_valid, msg = GeometryProcessor.validate_file(filename, size)
        if not is_valid:
            raise ValueError(msg)

        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
            uploaded_file.save(tmp.name)
            temp_path = tmp.name

        try:
            features = GeometryProcessor.extract_geometries(temp_path, filename)
            if not features:
                raise ValueError("No se encontraron geometrías válidas en el archivo")
            return features
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    # ------------------------------
    # Unidad funcional individual
    # ------------------------------
    @staticmethod
    def assign_to_unit(uf_id, uploaded_file):
        """Asigna la primera geometría del archivo a una UF existente."""
        uf = UnidadFuncional.query.get(uf_id)
        if not uf:
            raise ValueError(f"Unidad funcional {uf_id} no encontrada")

        features = GeometryAssigner.extract_file_features(uploaded_file)
        geometry = features[0].get("geometry")
        uf.geometry_json = json.dumps(geometry)
        db.session.commit()
        return uf.id

    # ------------------------------
    # Proyecto completo (con dry-run)
    # ------------------------------
    @staticmethod
    def assign_to_project(proyecto, uploaded_file, dry_run=False):
        """
        Asigna geometrías del archivo a las UFs del proyecto.
        - No crea nuevas UFs.
        - No modifica otros campos.
        - Si dry_run=True, solo devuelve un resumen sin aplicar cambios.
        """
        features = GeometryAssigner.extract_file_features(uploaded_file)

        updated = 0
        skipped = []
        errors = []
        preview = []

        for idx, f in enumerate(features, start=1):
            try:
                props = f.get("properties", {})
                numero = None

                # --- Intentar obtener el número desde propiedades ---
                for key in ["numero", "Numero", "NUMERO", "uf", "UF", "unidad", "Unidad"]:
                    if key in props:
                        try:
                            numero = int(props[key])
                            break
                        except (ValueError, TypeError):
                            continue

                # --- Si no hay propiedades, intentar desde el nombre del Placemark ---
                if numero is None:
                    name = f.get("name") or props.get("name")
                    if name:
                        match = re.search(r"UF[-\s]*(\d+)", name)
                        if match:
                            numero = int(match.group(1))

                if numero is None:
                    skipped.append({"feature": idx, "reason": "No se encontró número de UF"})
                    continue

                # Buscar UF existente en la base de datos
                uf = UnidadFuncional.query.filter_by(proyecto_id=proyecto.id, numero=numero).first()
                if not uf:
                    skipped.append({"feature": idx, "reason": f"UF {numero} no encontrada"})
                    continue

                geom = f.get("geometry")
                geom_type = shapely_shape(geom).geom_type if geom else None

                preview.append({
                    "numero": numero,
                    "geom_type": geom_type,
                    "uf_id": uf.id,
                    "action": "update"
                })

                if not dry_run:
                    uf.geometry_json = json.dumps(geom)
                    updated += 1

            except Exception as e:
                errors.append({"feature": idx, "error": str(e)})
                continue

        if not dry_run:
            db.session.commit()

        return {
            "dry_run": dry_run,
            "updated": updated,
            "skipped": skipped,
            "errors": errors,
            "preview": preview if dry_run else None,
            "total_features": len(features)
        }
