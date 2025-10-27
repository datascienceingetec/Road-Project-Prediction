from flask import Blueprint, jsonify, request
from app.models import Proyecto, UnidadFuncional, ITEM_MODELS

proyectos_bp = Blueprint("proyectos_v1", __name__)

@proyectos_bp.route('/', methods=['GET'], strict_slashes=False)
def get_proyectos():
    proyectos = Proyecto.get_all()
    return jsonify(proyectos)

@proyectos_bp.route('/id/<int:proyecto_id>', methods=['GET'])
def get_proyecto_by_id(proyecto_id):
    proyecto = Proyecto.get_by_id(proyecto_id)
    if proyecto:
        return jsonify(proyecto)
    return jsonify({'error': 'Proyecto no encontrado'}), 404

@proyectos_bp.route('/<codigo>', methods=['GET'])
def get_proyecto(codigo):
    proyecto = Proyecto.get_by_codigo(codigo)
    if proyecto:
        return jsonify(proyecto)
    return jsonify({'error': 'Proyecto no encontrado'}), 404

@proyectos_bp.route('/', methods=['POST'])
def create_proyecto():
    data = request.get_json(silent=True) or {}
    proyecto_id = Proyecto.create(data)
    return jsonify({'id': proyecto_id, 'message': 'Proyecto creado'}), 201

@proyectos_bp.route('/<int:proyecto_id>', methods=['PUT'])
def update_proyecto(proyecto_id):
    data = request.get_json(silent=True) or {}
    Proyecto.update(proyecto_id, data)
    return jsonify({'message': 'Proyecto actualizado'})

@proyectos_bp.route('/<int:proyecto_id>', methods=['DELETE'])
def delete_proyecto(proyecto_id):
    Proyecto.delete(proyecto_id)
    return jsonify({'message': 'Proyecto eliminado'})

@proyectos_bp.route('/<codigo>/unidades-funcionales', methods=['GET'])
def get_unidades_funcionales(codigo):
    ufs = UnidadFuncional.get_by_codigo(codigo)
    if not ufs:
        return jsonify({'error': f'No se encontraron unidades funcionales para el proyecto {codigo}'}), 404
    return jsonify(ufs), 200

@proyectos_bp.route('/<codigo>/unidades-funcionales', methods=['POST'])
def create_unidad_funcional(codigo):
    data = request.get_json(silent=True) or {}
    data['codigo'] = codigo
    uf_id = UnidadFuncional.create(data)
    return jsonify({'id': uf_id, 'message': f'Unidad funcional creada para proyecto {codigo}'}), 201

@proyectos_bp.route('/<codigo>/unidades-funcionales/<int:uf_id>', methods=['DELETE'])
def delete_unidad_funcional(codigo, uf_id):
    UnidadFuncional.delete(uf_id)
    return jsonify({'message': f'Unidad funcional {uf_id} eliminada del proyecto {codigo}'}), 200

def get_item_model():
    fase = request.args.get('fase')
    if not fase:
        return None, jsonify({'error': 'Debe especificar un parámetro "fase"'}), 400
    model = ITEM_MODELS.get(fase)
    if not model:
        return None, jsonify({'error': f'Fase no válida: {fase}'}), 400
    return model, None, None

@proyectos_bp.route('/<codigo>/items', methods=['GET'])
def get_items(codigo):
    model, error_response, status = get_item_model()
    if error_response:
        return error_response, status
    item = model.get_by_codigo(codigo)
    if item:
        return jsonify(item)
    return jsonify({'error': f'Items no encontrados para el proyecto {codigo}'}), 404

@proyectos_bp.route('/<codigo>/items', methods=['POST'])
def create_item(codigo):
    model, error_response, status = get_item_model()
    if error_response:
        return error_response, status
    data = request.get_json(silent=True) or {}
    data['codigo'] = codigo
    existing = model.get_by_codigo(codigo)
    if existing:
        model.update(codigo, data)
        return jsonify({'message': 'Items actualizados'}), 200
    else:
        item_id = model.create(data)
        return jsonify({'id': item_id, 'message': 'Items creados'}), 201

@proyectos_bp.route('/<codigo>/items', methods=['PUT'])
def update_item(codigo):
    model, error_response, status = get_item_model()
    if error_response:
        return error_response, status
    data = request.get_json(silent=True) or {}
    data['codigo'] = codigo
    model.update(codigo, data)
    return jsonify({'message': 'Items actualizados'}), 200

@proyectos_bp.route('/<codigo>/items', methods=['DELETE'])
def delete_item(codigo):
    model, error_response, status = get_item_model()
    if error_response:
        return error_response, status
    model.delete(codigo)
    return jsonify({'message': 'Items eliminados'}), 200
