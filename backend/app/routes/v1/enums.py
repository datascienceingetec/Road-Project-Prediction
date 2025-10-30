from flask import Blueprint, jsonify
from app.enums import ENUMS_CATALOG, AlcanceEnum, ZonaEnum, TipoTerrenoEnum, get_enum_values

enums_bp = Blueprint("enums_v1", __name__)

@enums_bp.route('/', methods=['GET'], strict_slashes=False)
def get_all_enums():
    """Get all available enums for the application"""
    return jsonify(ENUMS_CATALOG)

@enums_bp.route('/alcance', methods=['GET'])
def get_alcance_options():
    """Get all Alcance options"""
    return jsonify(get_enum_values(AlcanceEnum))

@enums_bp.route('/zona', methods=['GET'])
def get_zona_options():
    """Get all Zona options"""
    return jsonify(get_enum_values(ZonaEnum))

@enums_bp.route('/tipo-terreno', methods=['GET'])
def get_tipo_terreno_options():
    """Get all Tipo Terreno options"""
    return jsonify(get_enum_values(TipoTerrenoEnum))
