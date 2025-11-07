from flask import Blueprint, jsonify, request
from app.models import db, ItemTipo

items_bp = Blueprint("items_v1", __name__)

@items_bp.route('/', methods=['GET'], strict_slashes=False)
def get_items():
    """Get all item tipos"""
    items = ItemTipo.query.all()
    return jsonify([i.to_dict() for i in items])

@items_bp.route('/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """Get a specific item tipo by ID"""
    item = ItemTipo.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item tipo no encontrado'}), 404
    return jsonify(item.to_dict())

@items_bp.route('/search', methods=['GET'])
def search_items():
    """Search item tipos by name"""
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Parámetro de búsqueda "q" es requerido'}), 400
    
    items = ItemTipo.query.filter(ItemTipo.nombre.ilike(f'%{query}%')).all()
    return jsonify([i.to_dict() for i in items])

@items_bp.route('/', methods=['POST'])
def create_item():
    """Create a new item tipo"""
    data = request.get_json(silent=True) or {}
    
    if not data.get('nombre'):
        return jsonify({'error': 'nombre es requerido'}), 400
    
    # Check if item already exists
    existing = ItemTipo.query.filter_by(nombre=data['nombre']).first()
    if existing:
        return jsonify({'error': 'Ya existe un item tipo con ese nombre'}), 409
    
    item = ItemTipo(
        nombre=data['nombre'],
        descripcion=data.get('descripcion')
    )
    db.session.add(item)
    db.session.commit()
    
    return jsonify({'id': item.id, 'message': 'Item tipo creado', 'item': item.to_dict()}), 201

@items_bp.route('/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    """Update an item tipo"""
    item = ItemTipo.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item tipo no encontrado'}), 404
    
    data = request.get_json(silent=True) or {}
    
    if 'nombre' in data:
        item.nombre = data['nombre']
    if 'descripcion' in data:
        item.descripcion = data['descripcion']
    
    db.session.commit()
    return jsonify({'message': 'Item tipo actualizado', 'item': item.to_dict()})

@items_bp.route('/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Delete an item tipo"""
    item = ItemTipo.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item tipo no encontrado'}), 404
    
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item tipo eliminado'})