import json
import os
import tempfile
import zipfile
from flask import Blueprint, jsonify, request, send_file
from app.models import db, Proyecto, UnidadFuncional, CostoItem, FaseItemRequerido
from app.services import GeometryProcessor, GeometryAssigner

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
        # longitud is computed from unidades_funcionales
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
    # longitud is computed from unidades_funcionales, cannot be updated directly
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

@proyectos_bp.route('/<codigo>/costos', methods=['GET'])
def get_costos(codigo):
    """Get all costs for a project with calculated values for parent items"""
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if not proyecto:
        return jsonify({'error': f'Proyecto {codigo} no encontrado'}), 404
    
    from app.models import FaseItemRequerido
    from app.utils import sort_items_by_description
    
    # Get fase items
    items_requeridos = FaseItemRequerido.query.filter_by(fase_id=proyecto.fase_id).all()
    items_ordenados = sort_items_by_description(items_requeridos)
    
    # Get costos
    costos = CostoItem.query.filter_by(proyecto_id=proyecto.id).all()
    costos_map = {c.item_tipo_id: c.valor for c in costos}
    
    # Build parent-child map
    parent_child_map = {}
    for item in items_requeridos:
        if item.parent_id:
            parent_item = next((i for i in items_requeridos if i.id == item.parent_id), None)
            if parent_item:
                if parent_item.item_tipo_id not in parent_child_map:
                    parent_child_map[parent_item.item_tipo_id] = []
                parent_child_map[parent_item.item_tipo_id].append(item.item_tipo_id)
    
    # Calculate values recursively
    def get_item_value(item_tipo_id):
        if item_tipo_id in parent_child_map:
            # Sum children
            return sum(get_item_value(child_id) for child_id in parent_child_map[item_tipo_id])
        return costos_map.get(item_tipo_id, 0)
    
    # Build result with fase items and calculated costs
    result = []
    for item in items_ordenados:
        item_dict = item.to_dict()
        item_dict['valor_calculado'] = get_item_value(item.item_tipo_id)
        result.append(item_dict)
    
    return jsonify(result), 200

@proyectos_bp.route('/<codigo>/costos', methods=['POST'])
def create_or_update_costos(codigo):
    """Create or update costs for a project. Expects array of {item_tipo_id, valor}
    Parent items are automatically calculated from their children."""
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if not proyecto:
        return jsonify({'error': f'Proyecto {codigo} no encontrado'}), 404
    
    data = request.get_json(silent=True) or {}
    costos_data = data.get('costos', [])
    
    if not isinstance(costos_data, list):
        return jsonify({'error': 'Se espera un array de costos'}), 400
    
    # Get all fase items to identify parent-child relationships
    fase_items = FaseItemRequerido.query.filter_by(fase_id=proyecto.fase_id).all()
    
    # Build parent-child map
    parent_map = {}  # parent_id -> [child_item_tipo_ids]
    for item in fase_items:
        if item.parent_id:
            if item.parent_id not in parent_map:
                parent_map[item.parent_id] = []
            parent_map[item.parent_id].append(item.item_tipo_id)
    
    # Find parent item_tipo_ids
    parent_item_tipo_ids = set()
    for item in fase_items:
        if item.id in parent_map:
            parent_item_tipo_ids.add(item.item_tipo_id)
    
    created = 0
    updated = 0
    
    # First, save all non-parent items
    for costo_data in costos_data:
        item_tipo_id = costo_data.get('item_tipo_id')
        valor = costo_data.get('valor', 0)
        
        if not item_tipo_id or item_tipo_id in parent_item_tipo_ids:
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
    
    # Now calculate and save parent items
    for fase_item in fase_items:
        if fase_item.id in parent_map:
            # This is a parent item, calculate sum of children
            child_item_tipo_ids = parent_map[fase_item.id]
            total = 0
            for child_id in child_item_tipo_ids:
                child_costo = CostoItem.query.filter_by(
                    proyecto_id=proyecto.id,
                    item_tipo_id=child_id
                ).first()
                if child_costo:
                    total += child_costo.valor
            
            # Update or create parent cost
            existing_parent = CostoItem.query.filter_by(
                proyecto_id=proyecto.id,
                item_tipo_id=fase_item.item_tipo_id
            ).first()
            
            if existing_parent:
                existing_parent.valor = total
                updated += 1
            else:
                parent_costo = CostoItem(
                    proyecto_id=proyecto.id,
                    item_tipo_id=fase_item.item_tipo_id,
                    valor=total
                )
                db.session.add(parent_costo)
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


# ========== GEOMETRY ENDPOINTS ==========

@proyectos_bp.route('/<codigo>/geometries', methods=['GET'])
def get_project_geometries(codigo):
    """
    GET /api/v1/proyectos/<codigo>/geometries
    Devuelve todas las geometrías asociadas a las unidades funcionales del proyecto.
    """
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404

    unidades = UnidadFuncional.query.filter_by(proyecto_id=proyecto.id).all()
    features = []

    for uf in unidades:
        if uf.geometry_json:
            try:
                geometry = json.loads(uf.geometry_json)
                features.append({
                    'type': 'Feature',
                    'id': uf.id,
                    'geometry': geometry,
                    'properties': {
                        'id': uf.id,
                        'numero': uf.numero,
                        'longitud_km': uf.longitud_km,
                        'alcance': uf.alcance.value if uf.alcance else None,
                        'zona': uf.zona.value if uf.zona else None,
                        'tipo_terreno': uf.tipo_terreno.value if uf.tipo_terreno else None,
                    }
                })
            except json.JSONDecodeError:
                continue

    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }

    return jsonify(geojson), 200


@proyectos_bp.route('/<codigo>/geometries', methods=['POST'])
def upload_project_geometries(codigo):
    """
    POST /api/v1/proyectos/<codigo>/geometries
    Asigna geometrías a las unidades funcionales del proyecto.
    - Si se usa ?dry_run=true, no aplica cambios y devuelve resumen.
    """
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No se proporcionó ningún archivo'}), 400

    dry_run = request.args.get('dry_run', 'false').lower() == 'true'

    try:
        result = GeometryAssigner.assign_to_project(
            proyecto,
            request.files['file'],
            dry_run=dry_run
        )

        status = 'preview' if dry_run else ('partial_success' if result['errors'] else 'success')
        message = (
            f"Previsualización completada ({len(result['preview'])} detectadas)"
            if dry_run
            else f"{result['updated']} geometrías asignadas exitosamente"
        )

        return jsonify({
            "status": status,
            "message": message,
            **result
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error procesando archivo: {str(e)}'}), 500

@proyectos_bp.route('/<codigo>/geometries/export/<format>', methods=['GET'])
def export_geometries(codigo, format):
    """
    Export project geometries to KML, Shapefile, or GeoJSON
    
    Args:
        codigo: Project code
        format: Export format (kml, shp, geojson)
    """
    proyecto = Proyecto.query.filter_by(codigo=codigo).first()
    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    
    # Get all unidades funcionales with geometries
    unidades = UnidadFuncional.query.filter_by(proyecto_id=proyecto.id).all()
    
    features = []
    for uf in unidades:
        if uf.geometry_json:
            try:
                geometry = json.loads(uf.geometry_json)
                features.append({
                    'geometry': geometry,
                    'properties': {
                        'numero': uf.numero,
                        'longitud_km': uf.longitud_km,
                        'alcance': uf.alcance.value if uf.alcance else None,
                        'zona': uf.zona.value if uf.zona else None,
                        'tipo_terreno': uf.tipo_terreno.value if uf.tipo_terreno else None
                    }
                })
            except json.JSONDecodeError:
                continue
    
    if not features:
        return jsonify({'error': 'No hay geometrías para exportar'}), 404
    
    try:
        if format.lower() == 'geojson':
            # Return GeoJSON directly
            geojson = GeometryProcessor.create_geojson_feature_collection(features)
            return jsonify(geojson), 200
        
        elif format.lower() == 'kml':
            # Export to KML
            with tempfile.NamedTemporaryFile(delete=False, suffix='.kml') as temp_file:
                output_path = GeometryProcessor.export_to_kml(features, temp_file.name)
                return send_file(
                    output_path,
                    as_attachment=True,
                    download_name=f'{codigo}.kml',
                    mimetype='application/vnd.google-earth.kml+xml'
                )
        
        elif format.lower() == 'shp':
            # Export to Shapefile (ZIP)
            with tempfile.TemporaryDirectory() as temp_dir:
                shp_path = GeometryProcessor.export_to_shapefile(features, temp_dir)
                
                # Create ZIP with all shapefile components
                zip_path = os.path.join(temp_dir, f'{codigo}.zip')
                with zipfile.ZipFile(zip_path, 'w') as zipf:
                    for file in os.listdir(temp_dir):
                        if file.startswith('export.'):
                            file_path = os.path.join(temp_dir, file)
                            zipf.write(file_path, arcname=file.replace('export', codigo))
                
                return send_file(
                    zip_path,
                    as_attachment=True,
                    download_name=f'{codigo}.zip',
                    mimetype='application/zip'
                )
        
        else:
            return jsonify({'error': f'Formato no soportado: {format}. Use: kml, shp, o geojson'}), 400
    
    except Exception as e:
        return jsonify({'error': f'Error exportando geometrías: {str(e)}'}), 500
