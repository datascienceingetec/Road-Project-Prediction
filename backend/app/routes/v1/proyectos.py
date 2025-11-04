from flask import Blueprint, jsonify, request
from app.models import db, Proyecto, UnidadFuncional, CostoItem

proyectos_bp = Blueprint("proyectos_v1", __name__)

@proyectos_bp.route('/', methods=['GET'], strict_slashes=False)
def get_proyectos():
    proyectos = Proyecto.query.order_by(Proyecto.created_at.desc()).all()
    return jsonify([p.to_dict() for p in proyectos])

@proyectos_bp.route('/id/<int:proyecto_id>', methods=['GET'])
def get_proyecto_by_id(proyecto_id):
    include_relations = request.args.get('include_relations', 'false').lower() == 'true'
    proyecto = Proyecto.query.get(proyecto_id)
    if proyecto:
        return jsonify(proyecto.to_dict(include_relations=include_relations))
    return jsonify({'error': 'Proyecto no encontrado'}), 404

@proyectos_bp.route('/<codigo>', methods=['GET'])
def get_proyecto(codigo):
    include_relations = request.args.get('include_relations', 'false').lower() == 'true'
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if proyecto:
        return jsonify(proyecto.to_dict(include_relations=include_relations))
    return jsonify({'error': 'Proyecto no encontrado'}), 404

@proyectos_bp.route('/', methods=['POST'])
def create_proyecto():
    data = request.get_json(silent=True) or {}
    
    # Validate required fields
    if not data.get('codigo') or not data.get('nombre') or not data.get('fase_id'):
        return jsonify({'error': 'codigo, nombre y fase_id son requeridos'}), 400
    
    # Check if proyecto already exists
    existing = Proyecto.query.filter_by(codigo=data['codigo']).first()
    if existing:
        return jsonify({'error': 'Ya existe un proyecto con ese código'}), 409
    
    proyecto = Proyecto(
        codigo=data['codigo'],
        nombre=data['nombre'],
        anio_inicio=data.get('anio_inicio'),
        duracion=data.get('duracion'),
        longitud=data.get('longitud'),
        ubicacion=data.get('ubicacion'),
        lat_inicio=data.get('lat_inicio'),
        lng_inicio=data.get('lng_inicio'),
        lat_fin=data.get('lat_fin'),
        lng_fin=data.get('lng_fin'),
        fase_id=data['fase_id']
    )
    db.session.add(proyecto)
    db.session.commit()
    
    return jsonify({'codigo': proyecto.codigo, 'message': 'Proyecto creado', 'proyecto': proyecto.to_dict()}), 201

@proyectos_bp.route('/<codigo>', methods=['PUT'])
def update_proyecto_by_codigo(codigo):
    data = request.get_json(silent=True) or {}
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()

    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404

    # Update fields
    if 'nombre' in data:
        proyecto.nombre = data['nombre']
    if 'codigo' in data:
        proyecto.codigo = data['codigo']
    if 'anio_inicio' in data:
        proyecto.anio_inicio = data['anio_inicio']
    if 'duracion' in data:
        proyecto.duracion = data['duracion']
    if 'longitud' in data:
        proyecto.longitud = data['longitud']
    if 'ubicacion' in data:
        proyecto.ubicacion = data['ubicacion']
    if 'lat_inicio' in data:
        proyecto.lat_inicio = data['lat_inicio']
    if 'lng_inicio' in data:
        proyecto.lng_inicio = data['lng_inicio']
    if 'lat_fin' in data:
        proyecto.lat_fin = data['lat_fin']
    if 'lng_fin' in data:
        proyecto.lng_fin = data['lng_fin']
    if 'fase_id' in data:
        proyecto.fase_id = data['fase_id']
    if 'status' in data:
        proyecto.status = data['status']

    db.session.commit()
    return jsonify({'message': 'Proyecto actualizado', 'proyecto': proyecto.to_dict()})

@proyectos_bp.route('/<int:proyecto_id>', methods=['DELETE'])
def delete_proyecto(proyecto_id):
    proyecto = Proyecto.query.get(proyecto_id)
    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    
    db.session.delete(proyecto)
    UnidadFuncional.query.filter_by(proyecto_id=proyecto.id).delete()
    CostoItem.query.filter_by(proyecto_id=proyecto.id).delete()
    db.session.commit()
    return jsonify({'message': 'Proyecto eliminado'})

@proyectos_bp.route('/<codigo>/unidades-funcionales', methods=['GET'])
def get_unidades_funcionales(codigo):
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if not proyecto:
        return jsonify({'error': f'Proyecto {codigo} no encontrado'}), 404
    
    ufs = UnidadFuncional.query.filter_by(proyecto_id=proyecto.id).order_by(UnidadFuncional.numero).all()
    return jsonify([uf.to_dict() for uf in ufs]), 200

@proyectos_bp.route('/<codigo>/unidades-funcionales', methods=['POST'])
def create_unidad_funcional(codigo):
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if not proyecto:
        return jsonify({'error': f'Proyecto {codigo} no encontrado'}), 404
    
    data = request.get_json(silent=True) or {}
    
    uf = UnidadFuncional(
        proyecto_id=proyecto.id,
        numero=data.get('numero', 1),
        longitud_km=data.get('longitud_km'),
        puentes_vehiculares_und=data.get('puentes_vehiculares_und', 0),
        puentes_vehiculares_mt2=data.get('puentes_vehiculares_mt2', 0),
        puentes_peatonales_und=data.get('puentes_peatonales_und', 0),
        puentes_peatonales_mt2=data.get('puentes_peatonales_mt2', 0),
        tuneles_und=data.get('tuneles_und', 0),
        tuneles_km=data.get('tuneles_km', 0),
        alcance=data.get('alcance'),
        zona=data.get('zona'),
        tipo_terreno=data.get('tipo_terreno')
    )
    db.session.add(uf)
    db.session.commit()
    
    return jsonify({'id': uf.id, 'message': f'Unidad funcional creada para proyecto {codigo}', 'unidad_funcional': uf.to_dict()}), 201

@proyectos_bp.route('/<codigo>/unidades-funcionales/<int:uf_id>', methods=['DELETE'])
def delete_unidad_funcional(codigo, uf_id):
    uf = UnidadFuncional.query.get(uf_id)
    if not uf:
        return jsonify({'error': 'Unidad funcional no encontrada'}), 404
    
    db.session.delete(uf)
    db.session.commit()
    return jsonify({'message': f'Unidad funcional {uf_id} eliminada del proyecto {codigo}'}), 200

# New endpoints for managing costs (items) with normalized schema

@proyectos_bp.route('/<codigo>/costos', methods=['GET'])
def get_costos(codigo):
    """Get all costs for a project"""
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if not proyecto:
        return jsonify({'error': f'Proyecto {codigo} no encontrado'}), 404
    
    costos = CostoItem.query.filter_by(proyecto_id=proyecto.id).all()
    return jsonify([c.to_dict() for c in costos]), 200

@proyectos_bp.route('/<codigo>/costos', methods=['POST'])
def create_or_update_costos(codigo):
    """Create or update costs for a project. Expects array of {item_tipo_id, valor}"""
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if not proyecto:
        return jsonify({'error': f'Proyecto {codigo} no encontrado'}), 404
    
    data = request.get_json(silent=True) or {}
    costos_data = data.get('costos', [])
    
    if not isinstance(costos_data, list):
        return jsonify({'error': 'Se espera un array de costos'}), 400
    
    created = 0
    updated = 0
    
    for costo_data in costos_data:
        item_tipo_id = costo_data.get('item_tipo_id')
        valor = costo_data.get('valor', 0)
        
        if not item_tipo_id:
            continue
        
        # Check if cost already exists
        existing = CostoItem.query.filter_by(
            proyecto_id=proyecto.id,
            item_tipo_id=item_tipo_id
        ).first()
        
        if existing:
            existing.valor = valor
            updated += 1
        else:
            costo = CostoItem(
                proyecto_id=proyecto.id,
                item_tipo_id=item_tipo_id,
                valor=valor
            )
            db.session.add(costo)
            created += 1
    
    db.session.commit()
    return jsonify({
        'message': f'{created} costos creados, {updated} actualizados',
        'created': created,
        'updated': updated
    }), 200

@proyectos_bp.route('/<codigo>/costos/<int:costo_id>', methods=['PUT'])
def update_costo(codigo, costo_id):
    """Update a specific cost"""
    costo = CostoItem.query.get(costo_id)
    if not costo:
        return jsonify({'error': 'Costo no encontrado'}), 404
    
    data = request.get_json(silent=True) or {}
    if 'valor' in data:
        costo.valor = data['valor']
    
    db.session.commit()
    return jsonify({'message': 'Costo actualizado', 'costo': costo.to_dict()}), 200

@proyectos_bp.route('/<codigo>/costos/<int:costo_id>', methods=['DELETE'])
def delete_costo(codigo, costo_id):
    """Delete a specific cost"""
    costo = CostoItem.query.get(costo_id)
    if not costo:
        return jsonify({'error': 'Costo no encontrado'}), 404
    
    db.session.delete(costo)
    db.session.commit()
    return jsonify({'message': 'Costo eliminado'}), 200
