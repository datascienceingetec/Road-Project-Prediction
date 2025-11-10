import json
from flask import Blueprint, jsonify, request
from app.models import db, UnidadFuncional
from app.services import GeometryProcessor, GeometryAssigner

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

@unidades_funcionales_bp.route("/<int:uf_id>/geometry", methods=["GET"])
def get_geometry(uf_id: int):
    """
    Devuelve la geometría de una unidad funcional como Feature GeoJSON.
    """
    uf = UnidadFuncional.query.get_or_404(uf_id)
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

@unidades_funcionales_bp.route("/<int:uf_id>/geometry", methods=["POST"])
def upload_geometry(uf_id: int):
    """
    POST /api/v1/unidades-funcionales/<id>/geometry
    Asigna la geometría del archivo a la unidad funcional indicada.
    Solo reemplaza geometry_json, sin modificar otros campos.
    """
    if "file" not in request.files:
        return jsonify({"error": "No se proporcionó ningún archivo"}), 400

    try:
        uf_id = GeometryAssigner.assign_to_unit(uf_id, request.files["file"])
        return jsonify({
            "status": "success",
            "message": "Geometría asignada correctamente",
            "unidad_funcional": uf_id
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error procesando geometría: {str(e)}"}), 500


@unidades_funcionales_bp.route("/<int:uf_id>/geometry", methods=["PUT"])
def update_geometry(uf_id: int):
    """
    Actualiza la geometría directamente mediante un payload JSON.
    """
    uf = UnidadFuncional.query.get_or_404(uf_id)
    data = request.get_json(silent=True) or {}

    if "geometry" not in data:
        return jsonify({"error": "Se requiere campo 'geometry'"}), 400

    uf.geometry_json = json.dumps(data["geometry"])

    # Control explícito del recálculo
    if data.get("recalculate_length", False):
        longitud_km = GeometryProcessor.calculate_length_km(uf.geometry_json)
        if longitud_km > 0:
            uf.longitud_km = longitud_km

    db.session.commit()
    return jsonify({"message": "Geometría actualizada"}), 200


@unidades_funcionales_bp.route("/<int:uf_id>/geometry", methods=["DELETE"])
def delete_geometry(uf_id: int):
    """
    Elimina la geometría asociada a la unidad funcional sin tocar otros campos.
    """
    uf = UnidadFuncional.query.get_or_404(uf_id)
    if not uf.geometry_json:
        return jsonify({"error": "La unidad funcional no tiene geometría"}), 404

    uf.geometry_json = None
    db.session.commit()
    return jsonify({"message": "Geometría eliminada"}), 200
