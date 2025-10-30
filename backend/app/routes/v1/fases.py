from flask import Blueprint, jsonify, request
from app.models import db, Fase, ItemTipo, FaseItemRequerido

fases_bp = Blueprint("fases_v1", __name__)

@fases_bp.route('/', methods=['GET'], strict_slashes=False)
def get_fases():
    """Get all fases"""
    fases = Fase.query.all()
    return jsonify([f.to_dict() for f in fases])

@fases_bp.route('/<int:fase_id>', methods=['GET'])
def get_fase(fase_id):
    """Get a specific fase by ID"""
    fase = Fase.query.get(fase_id)
    if not fase:
        return jsonify({'error': 'Fase no encontrada'}), 404
    return jsonify(fase.to_dict())

@fases_bp.route('/<int:fase_id>/items', methods=['GET'])
def get_fase_items(fase_id):
    """Get all item tipos required for a specific fase"""
    fase = Fase.query.get(fase_id)
    if not fase:
        return jsonify({'error': 'Fase no encontrada'}), 404
    
    items_requeridos = FaseItemRequerido.query.filter_by(fase_id=fase_id).all()
    return jsonify([ir.to_dict() for ir in items_requeridos])

@fases_bp.route('/', methods=['POST'])
def create_fase():
    """Create a new fase"""
    data = request.get_json(silent=True) or {}
    
    if not data.get('nombre'):
        return jsonify({'error': 'nombre es requerido'}), 400
    
    # Check if fase already exists
    existing = Fase.query.filter_by(nombre=data['nombre']).first()
    if existing:
        return jsonify({'error': 'Ya existe una fase con ese nombre'}), 409
    
    fase = Fase(
        nombre=data['nombre'],
        descripcion=data.get('descripcion')
    )
    db.session.add(fase)
    db.session.commit()
    
    return jsonify({'id': fase.id, 'message': 'Fase creada', 'fase': fase.to_dict()}), 201

@fases_bp.route('/<int:fase_id>', methods=['PUT'])
def update_fase(fase_id):
    """Update a fase"""
    fase = Fase.query.get(fase_id)
    if not fase:
        return jsonify({'error': 'Fase no encontrada'}), 404
    
    data = request.get_json(silent=True) or {}
    
    if 'nombre' in data:
        fase.nombre = data['nombre']
    if 'descripcion' in data:
        fase.descripcion = data['descripcion']
    
    db.session.commit()
    return jsonify({'message': 'Fase actualizada', 'fase': fase.to_dict()})

@fases_bp.route('/<int:fase_id>', methods=['DELETE'])
def delete_fase(fase_id):
    """Delete a fase"""
    fase = Fase.query.get(fase_id)
    if not fase:
        return jsonify({'error': 'Fase no encontrada'}), 404
    
    db.session.delete(fase)
    db.session.commit()
    return jsonify({'message': 'Fase eliminada'})