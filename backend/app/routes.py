
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

@api.route('/unidades-funcionales/<codigo>', methods=['GET'])
def get_unidades_funcionales(codigo):
    ufs = UnidadFuncional.get_by_codigo(codigo)
    return jsonify(ufs)

@api.route('/unidades-funcionales', methods=['POST'])
def create_unidad_funcional():
    data = request.get_json(silent=True) or {}
    uf_id = UnidadFuncional.create(data)
    return jsonify({'id': uf_id, 'message': 'Unidad funcional creada'}), 201

@api.route('/unidades-funcionales/<int:uf_id>', methods=['DELETE'])
def delete_unidad_funcional(uf_id):
    UnidadFuncional.delete(uf_id)
    return jsonify({'message': 'Unidad funcional eliminada'})

@api.route('/items/<fase>/<codigo>', methods=['GET'])
def get_items(fase, codigo):
    model = ITEM_MODELS.get(fase)
    if not model:
        return jsonify({'error': 'Fase no válida'}), 400

    item = model.get_by_codigo(codigo)
    if item:
        return jsonify(item)
    return jsonify({'error': f'Items no encontrados para {fase}'}), 404

@api.route('/items/<fase>', methods=['POST'])
def create_item(fase):
    model = ITEM_MODELS.get(fase)
    if not model:
        return jsonify({'error': 'Fase no válida'}), 400

    data = request.get_json(silent=True) or {}
    codigo = data.get('codigo')
    if not codigo:
        return jsonify({'error': 'El campo "codigo" es obligatorio'}), 400

    existing = model.get_by_codigo(codigo)
    if existing:
        model.update(codigo, data)
        return jsonify({'message': f'Items de {fase} actualizados'}), 200
    else:
        item_id = model.create(data)
        return jsonify({'id': item_id, 'message': f'Items de {fase} creados'}), 201

@api.route('/items/<fase>/<codigo>', methods=['PUT'])
def update_item(fase, codigo):
    model = ITEM_MODELS.get(fase)
    if not model:
        return jsonify({'error': 'Fase no válida'}), 400

    data = request.get_json(silent=True) or {}
    data['codigo'] = codigo
    model.update(codigo, data)
    return jsonify({'message': f'Items de {fase} actualizados'}), 200

@api.route('/items/<fase>/<codigo>', methods=['DELETE'])
def delete_item(fase, codigo):
    model = ITEM_MODELS.get(fase)
    if not model:
        return jsonify({'error': 'Fase no válida'}), 400

    model.delete(codigo)
    return jsonify({'message': f'Items de {fase} eliminados'}), 200

@api.route('/predict', methods=['POST'])
def predict_cost():
    data = request.get_json(silent=True) or {}
    prediction = data['longitud'] * 50000 * (1 + data['num_ufs'] * 0.1)
    return jsonify({'costo_predicho': round(prediction, 2)})

