from flask import Blueprint, jsonify, request
from sqlalchemy import func
from app.models import db, Proyecto, UnidadFuncional, CostoItem, ItemTipo, Fase, AnualIncrement
import numpy as np

charts_bp = Blueprint("charts_v1", __name__)


def calculate_present_value(past_value, past_year, present_year):
    """Calculate present value using annual increments from database"""
    if past_year is None or present_year <= past_year:
        return float(past_value)
    
    # Get annual increments
    increments = AnualIncrement.query.filter(
        AnualIncrement.ano > past_year,
        AnualIncrement.ano <= present_year
    ).order_by(AnualIncrement.ano).all()
    
    # Apply compound increments
    factor = 1.0
    for inc in increments:
        inc_value = inc.valor
        if inc_value > 1.0:
            inc_value = inc_value / 100.0
        factor *= (1.0 + inc_value)
    
    return float(past_value) * factor


@charts_bp.route('/valor-presente-causacion', methods=['GET'])
def get_valor_presente_causacion():
    """
    Endpoint para obtener datos del gráfico de Valor Presente de la Causación de Personal.
    
    Query Parameters:
    - fase_id: ID de la fase (opcional, filtra por fase)
    - alcance: Tipo de alcance (opcional, filtra por alcance)
    - present_year: Año presente para cálculo de valor presente. Default: 2025
    
    Returns:
    - projects: Lista de proyectos con datos agregados para el scatter plot
    - trend_line: Datos de la línea de tendencia lineal
    """
    try:
        # Get query parameters
        fase_id = request.args.get('fase_id', type=int)
        alcance = request.args.get('alcance', type=str)
        present_year = int(request.args.get('present_year', 2025))

        # Build query for projects
        query = db.session.query(
            Proyecto.id,
            Proyecto.codigo,
            Proyecto.nombre,
            Proyecto.anio_inicio,
            Fase.nombre.label('fase_nombre'),
            Proyecto.status.label('status')
        ).join(Fase, Proyecto.fase_id == Fase.id)
        
        # Filter by fase if provided
        if fase_id:
            query = query.filter(Proyecto.fase_id == fase_id)
        
        # Filter by alcance if provided
        if alcance:
            query = query.join(UnidadFuncional, Proyecto.id == UnidadFuncional.proyecto_id)
            query = query.filter(UnidadFuncional.alcance == alcance)
            query = query.distinct()
        
        proyectos = query.all()
        
        projects_data = []
        
        for proyecto in proyectos:
            # Get all costs for this project
            costos = db.session.query(
                func.sum(CostoItem.valor).label('costo_total')
            ).filter(
                CostoItem.proyecto_id == proyecto.id
            ).scalar() or 0
            
            # Calculate present value
            costo_vp = calculate_present_value(
                costos,
                proyecto.anio_inicio,
                present_year
            )
            
            # Get total length from functional units
            longitud_total = db.session.query(
                func.sum(UnidadFuncional.longitud_km)
            ).filter(
                UnidadFuncional.proyecto_id == proyecto.id
            ).scalar() or 0
            
            # Count functional units
            num_ufs = db.session.query(
                func.count(UnidadFuncional.id)
            ).filter(
                UnidadFuncional.proyecto_id == proyecto.id
            ).scalar() or 0
            
            # Get first alcance (could aggregate differently if needed)
            alcance_row = db.session.query(
                UnidadFuncional.alcance
            ).filter(
                UnidadFuncional.proyecto_id == proyecto.id
            ).first()

            alcance_value = None
            if alcance_row and alcance_row[0]:
                alcance_value = alcance_row[0].value  # Enum → string
            
            projects_data.append({
                'codigo': proyecto.codigo,
                'nombre': proyecto.nombre,
                'anio_inicio': proyecto.anio_inicio,
                'fase': proyecto.fase_nombre,
                'longitud_km': float(longitud_total),
                'costo_total_vp': float(costo_vp),
                'costo_millones': float(costo_vp / 1_000_000),
                'unidades_funcionales': num_ufs,
                'alcance': alcance_value
            })
        
        # Filter out projects with zero length for regression
        valid_projects = [p for p in projects_data if p['longitud_km'] > 0]
        
        if len(valid_projects) < 2:
            return jsonify({
                'projects': projects_data,
                'trend_line': None,
                'metadata': {
                    'fase_id': fase_id,
                    'alcance': alcance,
                    'present_year': present_year,
                    'total_projects': len(projects_data)
                }
            })
        
        # Calculate linear regression for trend line
        from sklearn.linear_model import LinearRegression
        X = np.array([[p['longitud_km']] for p in valid_projects])
        y = np.array([p['costo_millones'] for p in valid_projects])
        
        model = LinearRegression()
        model.fit(X, y)
        y_pred = model.predict(X)
        
        # Sort for line plot
        sort_idx = X.flatten().argsort()
        trend_line = {
            'x': X[sort_idx].flatten().tolist(),
            'y': y_pred[sort_idx].tolist(),
            'slope': float(model.coef_[0]),
            'intercept': float(model.intercept_)
        }
        
        return jsonify({
            'projects': projects_data,
            'trend_line': trend_line,
            'metadata': {
                'fase_id': fase_id,
                'alcance': alcance,
                'present_year': present_year,
                'total_projects': len(projects_data)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@charts_bp.route('/causacion-por-km', methods=['GET'])
def get_causacion_por_km():
    """
    Endpoint para obtener datos del gráfico de Causación promedio por kilómetro.
    
    Query Parameters:
    - fase_id: ID de la fase (opcional, filtra por fase)
    - alcance: Tipo de alcance (opcional, filtra por alcance)
    - present_year: Año presente para cálculo de valor presente. Default: 2025
    
    Returns:
    - summary: Datos estadísticos por categoría y alcance
    - heatmap_data: Matriz pivotada para el heatmap (categoría x alcance)
    - categories: Lista de categorías (items)
    - alcances: Lista de tipos de alcance
    """
    try:
        # Get query parameters
        fase_id = request.args.get('fase_id', type=int)
        alcance = request.args.get('alcance', type=str)
        present_year = int(request.args.get('present_year', 2025))
        
        # Build base query
        query = db.session.query(
            Proyecto.id.label('proyecto_id'),
            Proyecto.anio_inicio,
            UnidadFuncional.id.label('uf_id'),
            UnidadFuncional.longitud_km,
            UnidadFuncional.alcance,
            ItemTipo.id.label('item_id'),
            ItemTipo.nombre.label('item_nombre'),
            CostoItem.valor
        ).join(
            UnidadFuncional, Proyecto.id == UnidadFuncional.proyecto_id
        ).join(
            CostoItem, Proyecto.id == CostoItem.proyecto_id
        ).join(
            ItemTipo, CostoItem.item_tipo_id == ItemTipo.id
        )
        
        # Filter by fase if provided
        if fase_id:
            query = query.filter(Proyecto.fase_id == fase_id)
        
        # Filter by alcance if provided
        if alcance:
            query = query.filter(UnidadFuncional.alcance == alcance)
        
        # Filter out invalid data
        query = query.filter(
            UnidadFuncional.longitud_km > 0,
            UnidadFuncional.alcance.isnot(None),
            CostoItem.valor > 0
        )
        
        results = query.all()
        
        # Group data by item and alcance
        from collections import defaultdict
        data_by_item_alcance = defaultdict(lambda: defaultdict(list))
        
        for row in results:
            # Calculate present value
            valor_vp = calculate_present_value(
                row.valor,
                row.anio_inicio,
                present_year
            )
            
            # Calculate cost per km
            costo_por_km = valor_vp / row.longitud_km
            
            # Store in nested dict
            alcance_value = row.alcance.value if row.alcance else 'Sin especificar'
            data_by_item_alcance[row.item_nombre][alcance_value].append(costo_por_km)
        
        # Calculate statistics
        summary_data = []
        categories = set()
        alcances = set()
        
        for item_nombre, alcances_dict in data_by_item_alcance.items():
            categories.add(item_nombre)
            for alcance, valores in alcances_dict.items():
                alcances.add(alcance)
                valores_array = np.array(valores)
                
                summary_data.append({
                    'category': item_nombre,
                    'alcance': alcance,
                    'mean_millones': float(valores_array.mean() / 1e6),
                    'median_millones': float(np.median(valores_array) / 1e6),
                    'std_millones': float(valores_array.std() / 1e6),
                    'min_millones': float(valores_array.min() / 1e6),
                    'max_millones': float(valores_array.max() / 1e6),
                    'count': len(valores)
                })
        
        # Create heatmap data structure
        categories_list = sorted(list(categories))
        alcances_list = sorted(list(alcances))
        
        # Build pivot structure
        heatmap_data = []
        for category in categories_list:
            row_data = {'category': category}
            for alcance in alcances_list:
                # Find matching summary item
                matching = [s for s in summary_data 
                           if s['category'] == category and s['alcance'] == alcance]
                row_data[alcance] = matching[0]['mean_millones'] if matching else None
            heatmap_data.append(row_data)
        
        return jsonify({
            'summary': summary_data,
            'heatmap_data': heatmap_data,
            'categories': categories_list,
            'alcances': alcances_list,
            'metadata': {
                'fase_id': fase_id,
                'alcance': alcance,
                'present_year': present_year,
                'total_items': len(summary_data)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@charts_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'charts'})
