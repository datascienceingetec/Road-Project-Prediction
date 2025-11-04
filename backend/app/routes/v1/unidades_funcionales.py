from flask import Blueprint, jsonify, request
from app.models import db, UnidadFuncional

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