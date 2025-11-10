import json
import os
from flask import Blueprint, jsonify, request
from app.models import db, UnidadFuncional
from app.services.geometry_processor import GeometryProcessor

unidades_funcionales_bp = Blueprint("unidades_funcionales_v1", __name__)

@unidades_funcionales_bp.route("/<int:id>", methods=["GET"])
def get_unidad_funcional(id: int):
    uf = UnidadFuncional.query.get(id)
    if not uf:
        return jsonify({"error": "Unidad funcional no encontrada"}), 404
    return jsonify(uf.to_dict()), 200

@unidades_funcionales_bp.route("/", methods=["POST"])
def create_unidad_funcional():
    data = request.get_json()
    
    uf = UnidadFuncional(
        proyecto_id=data["proyecto_id"],
        numero=data.get("numero", 1),
        longitud_km=data.get("longitud_km"),
        puentes_vehiculares_und=data.get("puentes_vehiculares_und", 0),
        puentes_vehiculares_mt2=data.get("puentes_vehiculares_mt2", 0),
        puentes_peatonales_und=data.get("puentes_peatonales_und", 0),
        puentes_peatonales_mt2=data.get("puentes_peatonales_mt2", 0),
        tuneles_und=data.get("tuneles_und", 0),
        tuneles_km=data.get("tuneles_km", 0),
        alcance=data.get("alcance"),
        zona=data.get("zona"),
        tipo_terreno=data.get("tipo_terreno")
    )
    db.session.add(uf)
    db.session.commit()
    
    return jsonify({"id": uf.id, "message": "Unidad funcional creada", "unidad_funcional": uf.to_dict()}), 201

@unidades_funcionales_bp.route("/<int:id>", methods=["PUT"])
def update_unidad_funcional(id: int):
    data = request.get_json()
    
    uf = UnidadFuncional.query.get(id)
    if not uf:
        return jsonify({"error": "Unidad funcional no encontrada"}), 404
    
    uf.numero = data.get("numero", uf.numero)
    uf.longitud_km = data.get("longitud_km", uf.longitud_km)
    uf.puentes_vehiculares_und = data.get("puentes_vehiculares_und", uf.puentes_vehiculares_und)
    uf.puentes_vehiculares_mt2 = data.get("puentes_vehiculares_mt2", uf.puentes_vehiculares_mt2)
    uf.puentes_peatonales_und = data.get("puentes_peatonales_und", uf.puentes_peatonales_und)
    uf.puentes_peatonales_mt2 = data.get("puentes_peatonales_mt2", uf.puentes_peatonales_mt2)
    uf.tuneles_und = data.get("tuneles_und", uf.tuneles_und)
    uf.tuneles_km = data.get("tuneles_km", uf.tuneles_km)
    uf.alcance = data.get("alcance", uf.alcance)
    uf.zona = data.get("zona", uf.zona)
    uf.tipo_terreno = data.get("tipo_terreno", uf.tipo_terreno)
    
    db.session.commit()
    return jsonify(uf.to_dict()), 200

@unidades_funcionales_bp.route("/<int:id>", methods=["DELETE"])
def delete_unidad_funcional(id: int):
    uf = UnidadFuncional.query.get(id)
    if not uf:
        return jsonify({"error": "Unidad funcional no encontrada"}), 404
    
    db.session.delete(uf)
    db.session.commit()
    return jsonify({"message": "Unidad funcional eliminada"}), 200


# ========== GEOMETRY ENDPOINTS ==========

@unidades_funcionales_bp.route("/<int:uf_id>/geometry", methods=["GET", "POST", "PUT", "DELETE"])
def manage_geometry(uf_id: int):
    """
    Manage geometry for a specific unidad funcional
    
    GET: Return geometry as GeoJSON Feature
    POST: Upload geometry from file (KML/SHP/GeoJSON)
    PUT: Update geometry with JSON payload
    DELETE: Remove geometry
    """
    uf = UnidadFuncional.query.get(uf_id)
    if not uf:
        return jsonify({"error": "Unidad funcional no encontrada"}), 404
    
    if request.method == "GET":
        if not uf.geometry_json:
            return jsonify({"error": "Esta unidad funcional no tiene geometría"}), 404
        
        try:
            geometry = json.loads(uf.geometry_json)
            return jsonify({
                "type": "Feature",
                "geometry": geometry,
                "properties": uf.to_dict()
            }), 200
        except json.JSONDecodeError:
            return jsonify({"error": "Geometría inválida"}), 500
    
    elif request.method == "POST":
        # Upload from file
        if "file" not in request.files:
            return jsonify({"error": "No se proporcionó archivo"}), 400
        
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "Archivo vacío"}), 400
        
        try:
            # Validate and extract geometry
            file_ext = GeometryProcessor.validate_file(file)
            features = GeometryProcessor.extract_geometries(file, file_ext)
            
            if not features:
                return jsonify({"error": "No se encontraron geometrías en el archivo"}), 400
            
            # Use first feature for this UF
            feature = features[0]
            geometry_json = json.dumps(feature["geometry"])
            longitud_km = GeometryProcessor.calculate_length_km(geometry_json)
            
            # Update UF
            uf.geometry_json = geometry_json
            if longitud_km > 0:
                uf.longitud_km = longitud_km
            
            db.session.commit()
            
            return jsonify({
                "status": "success",
                "message": "Geometría cargada exitosamente",
                "unidad_funcional": uf.to_dict(include_geometry=True)
            }), 200
            
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Error cargando geometría: {str(e)}"}), 500
    
    elif request.method == "PUT":
        # Update with JSON payload
        data = request.get_json()
        if not data or "geometry" not in data:
            return jsonify({"error": "Se requiere campo 'geometry'"}), 400
        
        try:
            # Validate and store geometry
            geometry_json = json.dumps(data["geometry"])
            uf.geometry_json = geometry_json
            
            # Optionally recalculate length
            if data.get("recalculate_length", True):
                longitud_km = GeometryProcessor.calculate_length_km(geometry_json)
                if longitud_km > 0:
                    uf.longitud_km = longitud_km
            
            db.session.commit()
            return jsonify({
                "status": "success",
                "message": "Geometría actualizada",
                "unidad_funcional": uf.to_dict(include_geometry=True)
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Error actualizando geometría: {str(e)}"}), 500
    
    elif request.method == "DELETE":
        uf.geometry_json = None
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": "Geometría eliminada"
        }), 200