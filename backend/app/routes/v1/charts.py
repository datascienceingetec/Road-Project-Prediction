from app.models import AlcanceEnum
from app.models import db, Proyecto, UnidadFuncional, CostoItem, ItemTipo, Fase, AnualIncrement
from collections import defaultdict
from flask import Blueprint, jsonify, request
from sklearn.linear_model import LinearRegression
from sqlalchemy import func
import numpy as np
import unicodedata

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
    """
    try:
        # --- helpers ---
        def _norm(s: str) -> str:
            # normaliza (quita tildes) y pone en minúscula para comparar
            return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii").casefold().strip()

        def _map_alcance_param_to_enum(param: str):
            if not param:
                return None
            index = {_norm(e.value): e for e in AlcanceEnum}
            return index.get(_norm(param))

        # --- params ---
        fase_id = request.args.get('fase_id', type=int)
        alcance_param = request.args.get('alcance', type=str)
        present_year = int(request.args.get('present_year', 2025))

        alcance_enum = _map_alcance_param_to_enum(alcance_param)

        # --- query base de proyectos ---
        query = db.session.query(
            Proyecto.id,
            Proyecto.codigo,
            Proyecto.nombre,
            Proyecto.anio_inicio,
            Fase.nombre.label('fase_nombre'),
            Proyecto.status.label('status')
        ).join(Fase, Proyecto.fase_id == Fase.id)

        if fase_id:
            query = query.filter(Proyecto.fase_id == fase_id)

        # Si llega alcance, nos aseguramos de que el proyecto tenga al menos una UF con ese alcance
        if alcance_enum:
            query = (
                query.join(UnidadFuncional, UnidadFuncional.proyecto_id == Proyecto.id)
                     .filter(UnidadFuncional.alcance == alcance_enum)
                     .distinct()
            )

        proyectos = query.all()

        projects_data = []

        for proyecto in proyectos:
            costos = db.session.query(
                func.sum(CostoItem.valor).label('costo_total')
            ).filter(CostoItem.proyecto_id == proyecto.id).scalar() or 0

            costo_vp = calculate_present_value(costos, proyecto.anio_inicio, present_year)

            # --- agregaciones de UFs: si hay alcance, se filtra por ese alcance ---
            uf_length_query = db.session.query(func.sum(UnidadFuncional.longitud_km)).filter(
                UnidadFuncional.proyecto_id == proyecto.id
            )
            uf_count_query = db.session.query(func.count(UnidadFuncional.id)).filter(
                UnidadFuncional.proyecto_id == proyecto.id
            )

            if alcance_enum:
                uf_length_query = uf_length_query.filter(UnidadFuncional.alcance == alcance_enum)
                uf_count_query = uf_count_query.filter(UnidadFuncional.alcance == alcance_enum)

            longitud_total = uf_length_query.scalar() or 0
            num_ufs = uf_count_query.scalar() or 0

            # --- alcance a mostrar en tooltip ---
            if alcance_enum:
                alcance_value = alcance_enum.value
            else:
                # si no se filtró por alcance, tomamos cualquiera (el primero) para mostrar
                alcance_row = db.session.query(UnidadFuncional.alcance).filter(
                    UnidadFuncional.proyecto_id == proyecto.id
                ).first()
                alcance_value = getattr(alcance_row[0], "value", alcance_row[0]) if alcance_row else None

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

        # --- regresión sólo con proyectos con longitud > 0 ---
        valid_projects = [p for p in projects_data if p['longitud_km'] > 0]

        if len(valid_projects) < 2:
            return jsonify({
                'projects': projects_data,
                'trend_line': None,
                'metadata': {
                    'fase_id': fase_id,
                    'alcance': alcance_enum.value if alcance_enum else None,
                    'present_year': present_year,
                    'total_projects': len(projects_data)
                }
            })

        X = np.array([[p['longitud_km']] for p in valid_projects])
        y = np.array([p['costo_millones'] for p in valid_projects])

        model = LinearRegression()
        model.fit(X, y)
        y_pred = model.predict(X)

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
                'alcance': alcance_enum.value if alcance_enum else None,
                'present_year': present_year,
                'total_projects': len(projects_data)
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@charts_bp.route('/causacion-por-km', methods=['GET'])
def get_causacion_por_km():
    """
    Endpoint para obtener datos del gráfico de Causación promedio por kilómetro (versión actualizada).

    Query Parameters:
    - fase_id: ID de la fase (opcional, filtra por fase)
    - alcance: Tipo de alcance (opcional, filtra por alcance)
    - present_year: Año presente para cálculo de valor presente. Default: 2025

    Returns:
    - summary: Datos estadísticos por categoría (ítem) y alcance
    - heatmap_data: Matriz pivotada para el heatmap (categoría x alcance)
    - categories: Lista de categorías (ítems)
    - alcances: Lista de tipos de alcance
    """
    try:
        fase_id = request.args.get('fase_id', type=int)
        alcance_filtro = request.args.get('alcance', type=str)
        present_year = int(request.args.get('present_year', 2025))
        # TODO: esta lista debería venir de algún lugar
        target_items = [
            'Diseño Geométrico', 'Trazado y Diseño Geométrico', 'Seguridad Vial', 'Sistemas Inteligentes',
            'Taludes', 'Pavimento', 'Socavación', 'Predial',
            'Impacto Ambiental', 'Otros - Manejo de Redes', 'Dirección y Coordinación'
        ]

        # --- Subconsulta: longitud total por proyecto ---
        total_longitud_subq = (
            db.session.query(
                UnidadFuncional.proyecto_id.label('proyecto_id'),
                func.sum(UnidadFuncional.longitud_km).label('longitud_total')
            )
            .group_by(UnidadFuncional.proyecto_id)
            .subquery()
        )

        # --- Query principal ---
        query = (
            db.session.query(
                Proyecto.id.label('proyecto_id'),
                Proyecto.anio_inicio,
                Proyecto.fase_id,
                UnidadFuncional.id.label('uf_id'),
                UnidadFuncional.longitud_km,
                UnidadFuncional.alcance,
                total_longitud_subq.c.longitud_total,
                ItemTipo.nombre.label('item_nombre'),
                CostoItem.valor
            )
            .join(UnidadFuncional, Proyecto.id == UnidadFuncional.proyecto_id)
            .join(CostoItem, Proyecto.id == CostoItem.proyecto_id)
            .join(ItemTipo, CostoItem.item_tipo_id == ItemTipo.id)
            .join(total_longitud_subq, Proyecto.id == total_longitud_subq.c.proyecto_id)
            .filter(
                UnidadFuncional.longitud_km > 0,
                UnidadFuncional.alcance.isnot(None),
                CostoItem.valor > 0,
                ItemTipo.nombre.in_(target_items)
            )
        )

        # Filtros opcionales
        if fase_id:
            query = query.filter(Proyecto.fase_id == fase_id)
        if alcance_filtro:
            query = query.filter(UnidadFuncional.alcance == alcance_filtro)

        results = query.all()

        # --- Agrupación por item y alcance ---
        data_by_item_alcance = defaultdict(lambda: defaultdict(list))

        for row in results:
            # Ponderación por longitud del proyecto
            peso_longitud = (
                row.longitud_km / row.longitud_total if row.longitud_total and row.longitud_total > 0 else 0
            )

            # Calcular valor presente
            valor_vp = calculate_present_value(
                row.valor,
                row.anio_inicio,
                present_year
            )

            # Distribuir costo por UF y calcular costo/km
            valor_ponderado = valor_vp * peso_longitud
            costo_por_km = valor_ponderado / row.longitud_km if row.longitud_km > 0 else 0

            alcance_val = row.alcance or 'Sin especificar'
            data_by_item_alcance[row.item_nombre][alcance_val].append(costo_por_km)

        # --- Estadísticas resumen ---
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

        # --- Datos para heatmap ---
        categories_list = sorted(list(categories))
        alcances_list = sorted(list(alcances))

        heatmap_data = []
        for category in categories_list:
            row_data = {'category': category}
            for alcance in alcances_list:
                match = [
                    s for s in summary_data
                    if s['category'] == category and s['alcance'] == alcance
                ]
                row_data[alcance] = match[0]['mean_millones'] if match else None
            heatmap_data.append(row_data)

        return jsonify({
            'summary': summary_data,
            'heatmap_data': heatmap_data,
            'categories': categories_list,
            'alcances': alcances_list,
            'metadata': {
                'fase_id': fase_id,
                'alcance': alcance_filtro,
                'present_year': present_year,
                'total_items': len(summary_data)
            }
        })

    except Exception as e:
        current_app.logger.exception("Error al generar causación por km")
        return jsonify({'error': str(e)}), 500

@charts_bp.route('/item-comparison', methods=['GET'])
def get_item_comparison():
    """
    Endpoint para obtener datos de comparación histórica de un ítem específico (versión detallada por UF).
    
    Query Parameters:
    - item_tipo_id: ID del tipo de ítem a comparar (requerido)
    - fase_id: ID de la fase (opcional, filtra por fase)
    - present_year: Año presente para cálculo de valor presente. Default: 2025
    
    Returns:
    - historical_data: Lista de UFs con el ítem calculado a valor presente
    - trend_line: Línea de regresión lineal global
    - metadata: Información sobre el ítem y filtros aplicados
    """
    try:
        item_tipo_id = request.args.get('item_tipo_id', type=int)
        fase_id = request.args.get('fase_id', type=int)
        present_year = int(request.args.get('present_year', 2025))
        
        if not item_tipo_id:
            return jsonify({'error': 'item_tipo_id es requerido'}), 400

        # Buscar el ItemTipo
        item_tipo = ItemTipo.query.get(item_tipo_id)
        if not item_tipo:
            return jsonify({'error': f'Item con ID {item_tipo_id} no encontrado'}), 404

        # Query detallada por Unidad Funcional (no agregada por proyecto)
        query = (
            db.session.query(
                Proyecto.id.label('proyecto_id'),
                Proyecto.codigo,
                Proyecto.nombre,
                Proyecto.anio_inicio,
                Fase.nombre.label('fase_nombre'),
                UnidadFuncional.id.label('uf_id'),
                UnidadFuncional.alcance,
                UnidadFuncional.longitud_km,
                CostoItem.valor.label('valor_item')
            )
            .join(Fase, Proyecto.fase_id == Fase.id)
            .join(UnidadFuncional, UnidadFuncional.proyecto_id == Proyecto.id)
            .join(CostoItem, CostoItem.proyecto_id == Proyecto.id)
            .filter(
                CostoItem.item_tipo_id == item_tipo.id,
                CostoItem.valor > 0,
                UnidadFuncional.longitud_km > 0
            )
        )

        if fase_id:
            query = query.filter(Proyecto.fase_id == fase_id)

        results = query.all()

        if not results:
            return jsonify({'historical_data': [], 'trend_line': None, 'metadata': {
                'item_nombre': item_tipo.nombre,
                'item_tipo_id': item_tipo.id,
                'fase_id': fase_id,
                'present_year': present_year,
                'total_projects': 0
            }})

        # --- Construir dataset detallado (por UF) ---
        historical_data = []
        for row in results:
            # Calcular valor presente a nivel de ítem individual (por UF)
            costo_vp = calculate_present_value(row.valor_item, row.anio_inicio, present_year)
            
            historical_data.append({
                'codigo': row.codigo,
                'nombre': row.nombre,
                'anio_inicio': row.anio_inicio,
                'fase': row.fase_nombre,
                'alcance': row.alcance.value if row.alcance else 'Sin especificar',
                'longitud_km': float(row.longitud_km),
                'costo_total_vp': float(costo_vp),
                'costo_millones': float(costo_vp / 1_000_000),
                'unidades_funcionales': 1  # cada fila es una UF individual
            })

        # --- Calcular regresión lineal sobre los puntos UF ---
        valid_data = [p for p in historical_data if p['longitud_km'] > 0 and p['costo_millones'] > 0]
        trend_line = None

        if len(valid_data) >= 2:
            X = np.array([[p['longitud_km']] for p in valid_data])
            y = np.array([p['costo_millones'] for p in valid_data])

            model = LinearRegression()
            model.fit(X, y)
            y_pred = model.predict(X)

            sort_idx = X.flatten().argsort()
            trend_line = {
                'x': X[sort_idx].flatten().tolist(),
                'y': y_pred[sort_idx].tolist(),
                'slope': float(model.coef_[0]),
                'intercept': float(model.intercept_)
            }

        return jsonify({
            'historical_data': historical_data,
            'trend_line': trend_line,
            'metadata': {
                'item_nombre': item_tipo.nombre,
                'item_tipo_id': item_tipo.id,
                'fase_id': fase_id,
                'present_year': present_year,
                'total_projects': len(historical_data)
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@charts_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'charts'})
