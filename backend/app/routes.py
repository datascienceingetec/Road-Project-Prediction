from flask import Blueprint, render_template, request, jsonify, current_app
from app.models import Proyecto, UnidadFuncional, ITEM_MODELS

api = Blueprint("api", __name__)

@api.route('/')
def index():
    return render_template('index.html', maps_api_key=current_app.config['GOOGLE_MAPS_API_KEY'])

@api.route('/proyectos', methods=['GET'])
def get_proyectos():
    proyectos = Proyecto.get_all()
    return jsonify(proyectos)

@api.route('/proyectos/<int:proyecto_id>', methods=['GET'])
def get_proyecto(proyecto_id):
    proyecto = Proyecto.get_by_id(proyecto_id)
    if proyecto:
        return jsonify(proyecto)
    return jsonify({'error': 'Proyecto no encontrado'}), 404

@api.route('/proyectos/codigo/<codigo>', methods=['GET'])
def get_proyecto_by_codigo(codigo):
    proyecto = Proyecto.get_by_codigo(codigo)
    if proyecto:
        return jsonify(proyecto)
    return jsonify({'error': 'Proyecto no encontrado'}), 404

@api.route('/proyectos', methods=['POST'])
def create_proyecto():
    data = request.get_json(silent=True) or {}
    proyecto_id = Proyecto.create(data)
    return jsonify({'id': proyecto_id, 'message': 'Proyecto creado'}), 201

@api.route('/proyectos/<int:proyecto_id>', methods=['PUT'])
def update_proyecto(proyecto_id):
    data = request.get_json(silent=True) or {}
    Proyecto.update(proyecto_id, data)
    return jsonify({'message': 'Proyecto actualizado'})

@api.route('/proyectos/<int:proyecto_id>', methods=['DELETE'])
def delete_proyecto(proyecto_id):
    Proyecto.delete(proyecto_id)
    return jsonify({'message': 'Proyecto eliminado'})

@api.route('/proyectos/<codigo>/unidades-funcionales', methods=['GET'])
def get_unidades_funcionales(codigo):
    ufs = UnidadFuncional.get_by_codigo(codigo)
    if not ufs:
        return jsonify({'error': f'No se encontraron unidades funcionales para el proyecto {codigo}'}), 404
    return jsonify(ufs), 200

@api.route('/proyectos/<codigo>/unidades-funcionales', methods=['POST'])
def create_unidad_funcional(codigo):
    data = request.get_json(silent=True) or {}
    data['codigo'] = codigo
    uf_id = UnidadFuncional.create(data)
    return jsonify({'id': uf_id, 'message': f'Unidad funcional creada para proyecto {codigo}'}), 201

@api.route('/proyectos/<codigo>/unidades-funcionales/<int:uf_id>', methods=['DELETE'])
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

@api.route('/proyectos/<codigo>/items', methods=['GET'])
def get_items(codigo):
    model, error_response, status = get_item_model()
    if error_response:
        return error_response, status
    item = model.get_by_codigo(codigo)
    if item:
        return jsonify(item)
    return jsonify({'error': f'Items no encontrados para el proyecto {codigo}'}), 404

@api.route('/proyectos/<codigo>/items', methods=['POST'])
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

@api.route('/proyectos/<codigo>/items', methods=['PUT'])
def update_item(codigo):
    model, error_response, status = get_item_model()
    if error_response:
        return error_response, status
    data = request.get_json(silent=True) or {}
    data['codigo'] = codigo
    model.update(codigo, data)
    return jsonify({'message': 'Items actualizados'}), 200

@api.route('/proyectos/<codigo>/items', methods=['DELETE'])
def delete_item(codigo):
    model, error_response, status = get_item_model()
    if error_response:
        return error_response, status
    model.delete(codigo)
    return jsonify({'message': 'Items eliminados'}), 200

@api.route('/predict', methods=['POST'])
def predict_cost():
    data = request.get_json(silent=True) or {}
    longitud = data.get('longitud', 0)
    num_ufs = data.get('num_ufs', 0)
    prediction = longitud * 50000 * (1 + num_ufs * 0.1)
    return jsonify({'costo_predicho': round(prediction, 2)})