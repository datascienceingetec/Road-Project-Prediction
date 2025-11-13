from app.models import AlcanceEnum
from app.models import db, Proyecto, UnidadFuncional, CostoItem, ItemTipo, Fase, FaseItemRequerido
from collections import defaultdict
from flask import Blueprint, jsonify, request, current_app
from sklearn.linear_model import LinearRegression
from sqlalchemy import func
import numpy as np
import unicodedata
from math import sqrt
from app.services import ModelService
from app.utils.charts_utils import calculate_present_value, normalize_key, get_predictor_config, calculate_predictor_value

charts_bp = Blueprint("charts_v1", __name__)

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
    Endpoint para obtener datos de comparación histórica de un ítem específico con predictores adaptativos.

    Usa predictores específicos según el tipo de ítem:
    - Suelos (4): Puentes Vehiculares M²
    - Estructuras (8): Puentes Vehiculares (Unidades)
    - Túneles (9): Túneles (Unidades + Km)
    - Urbanismo y Paisajismo (10): Puentes Peatonales (Unidades)
    - Cantidades (13): Puentes Combinados (Vehiculares + Peatonales)
    - Otros: Longitud (Km) - por defecto

    Query Parameters:
    - item_tipo_id: ID del tipo de ítem a comparar (requerido)
    - fase_id: ID de la fase (opcional, filtra por fase)
    - present_year: Año presente para cálculo de valor presente. Default: 2025

    Returns:
    - historical_data: Lista de UFs con predictor_value y predictor_name
    - trend_line: Regresión lineal usando el predictor específico
    - metadata: Información sobre el ítem, filtros y predictor usado
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
        
        # Configurar predictores específicos según el tipo de ítem
        predictor_config = get_predictor_config(item_tipo.nombre)
        predictor_columns = predictor_config['predictors']
        predictor_name = predictor_config['name']

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
                UnidadFuncional.puentes_vehiculares_und,
                UnidadFuncional.puentes_vehiculares_mt2,
                UnidadFuncional.puentes_peatonales_und,
                UnidadFuncional.puentes_peatonales_mt2,
                UnidadFuncional.tuneles_und,
                UnidadFuncional.tuneles_km,
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
            return jsonify({
                'historical_data': [],
                'trend_line': None,
                'metadata': {
                    'item_nombre': item_tipo.nombre,
                    'item_tipo_id': item_tipo.id,
                    'fase_id': fase_id,
                    'present_year': present_year,
                    'total_projects': 0
                }
            })

        # ----------------------------------------------------------------------
        # 1️⃣ Calcular longitud total por proyecto (para obtener pesos relativos)
        # ----------------------------------------------------------------------
        project_lengths = {}
        for row in results:
            project_lengths[row.codigo] = project_lengths.get(row.codigo, 0) + float(row.longitud_km)

        # ----------------------------------------------------------------------
        # 2️⃣ Construir dataset detallado (por UF) aplicando pesos por longitud
        # ----------------------------------------------------------------------
        historical_data = []
        for row in results:
            total_length = project_lengths.get(row.codigo, 0)
            uf_weight = float(row.longitud_km) / total_length if total_length > 0 else 0.0

            # Valor total del ítem (a nivel proyecto)
            costo_vp_total = calculate_present_value(row.valor_item, row.anio_inicio, present_year)

            # Ponderar el costo por longitud de la UF
            costo_vp_ponderado = costo_vp_total * uf_weight
            
            # Calcular valor del predictor específico para este ítem
            predictor_value = calculate_predictor_value(row, predictor_columns)

            historical_data.append({
                'codigo': row.codigo,
                'nombre': row.nombre,
                'anio_inicio': row.anio_inicio,
                'fase': row.fase_nombre,
                'alcance': row.alcance.value if hasattr(row.alcance, 'value') else (row.alcance or 'Sin especificar'),
                'longitud_km': float(row.longitud_km),
                'longitud_total_proyecto': float(total_length),
                'peso_longitud': round(uf_weight, 4),
                'costo_total_vp': float(costo_vp_ponderado),
                'costo_millones': float(costo_vp_ponderado / 1_000_000),
                'predictor_value': predictor_value,
                'predictor_name': predictor_name,
                'unidades_funcionales': 1
            })

        # ----------------------------------------------------------------------
        # 3️⃣ Calcular línea de tendencia global usando el predictor específico
        # ----------------------------------------------------------------------
        valid_data = [p for p in historical_data if p['predictor_value'] > 0 and p['costo_millones'] > 0]
        trend_line = None

        if len(valid_data) >= 2:
            X = np.array([[p['predictor_value']] for p in valid_data])
            y = np.array([p['costo_millones'] for p in valid_data])

            model = LinearRegression()
            model.fit(X, y)
            y_pred = model.predict(X)

            sort_idx = X.flatten().argsort()
            trend_line = {
                'x': X[sort_idx].flatten().tolist(),
                'y': y_pred[sort_idx].tolist(),
                'slope': float(model.coef_[0]),
                'intercept': float(model.intercept_),
                'predictor_name': predictor_name
            }

        # ----------------------------------------------------------------------
        # 4️⃣ Responder datos ponderados por longitud
        # ----------------------------------------------------------------------
        return jsonify({
            'historical_data': historical_data,
            'trend_line': trend_line,
            'metadata': {
                'item_nombre': item_tipo.nombre,
                'item_tipo_id': item_tipo.id,
                'fase_id': fase_id,
                'present_year': present_year,
                'total_projects': len(set([p['codigo'] for p in historical_data])),
                'total_ufs': len(historical_data),
                'predictor_name': predictor_name,
                'predictor_columns': predictor_columns
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@charts_bp.route('/item-real-vs-predicted', methods=['GET'])
def get_item_real_vs_predicted():
    """
    Endpoint que devuelve la comparativa de valor real vs valor predicho
    para un ítem específico utilizando el mismo modelo empleado en las
    predicciones actuales.
    """
    try:
        # Parámetros del request
        item_tipo_id = request.args.get('item_tipo_id', type=int)
        fase_id = request.args.get('fase_id', type=int)
        alcance_filter = request.args.get('alcance', type=str)

        # Validaciones iniciales
        if not item_tipo_id:
            return jsonify({'error': 'item_tipo_id es requerido'}), 400
        if not fase_id:
            return jsonify({'error': 'fase_id es requerido'}), 400

        # Obtener fase
        fase = Fase.query.get(fase_id)
        if not fase:
            return jsonify({'error': f'Fase con ID {fase_id} no encontrada'}), 404

        # Obtener el ítem requerido
        fase_item_req = FaseItemRequerido.query.filter_by(
            fase_id=fase_id,
            item_tipo_id=item_tipo_id
        ).first()

        if not fase_item_req:
            return jsonify({
                'error': f'Item con ID {item_tipo_id} no encontrado para la fase {fase_id}'
            }), 404

        print(fase_item_req.descripcion)

        # Cargar modelo y datos usando el adapter
        model_service = ModelService()
        
        try:
            comparison_data = model_service.get_comparison_data(fase_id, fase_item_req.descripcion)
            df = comparison_data['historical_data']
            item_column = comparison_data['item_column']
            target_models = comparison_data['models']
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        print(f"Found item column: {item_column}")
        print(f"Available models: {list(target_models.keys())}")
        # Buscar modelo correspondiente al ítem
        target_key = None
        # TODO: Remove this when the models are updated
        if fase_item_req.descripcion == '3.1 - GEOLOGÍA':
            normalized_item_name = normalize_key('3 - GEOLOGÍA')
        else:
            normalized_item_name = normalize_key(fase_item_req.descripcion)
        for key in target_models.keys():
            if normalize_key(key) == normalized_item_name:
                target_key = key
                break

        if not target_key:
            return jsonify({
                'error': (
                    f'El ítem "{fase_item_req.descripcion}" '
                    'no tiene un modelo asociado en la fase seleccionada'
                )
            }), 400

        points = []
        real_values = []
        predicted_values = []

        # Calcular valores reales vs predichos usando columnas normalizadas
        for _, row in df.iterrows():
            actual_value = row.get(item_column)
            if actual_value is None or (isinstance(actual_value, float) and np.isnan(actual_value)):
                continue

            if float(actual_value) == 0:
                continue

            pred_params = {
                'codigo': row.get('codigo', ''),
                'longitud_km': float(row.get('longitud_km') or 0),
                'puentes_vehiculares_und': int(row.get('puentes_vehiculares_und') or 0),
                'puentes_vehiculares_m2': float(row.get('puentes_vehiculares_m2') or 0),
                'puentes_peatonales_und': int(row.get('puentes_peatonales_und') or 0),
                'puentes_peatonales_m2': float(row.get('puentes_peatonales_m2') or 0),
                'tuneles_und': int(row.get('tuneles_und') or 0),
                'tuneles_km': float(row.get('tuneles_km') or 0),
                'alcance': row.get('alcance', '') or ''
            }

            predictions = model_service.adapter.predict(
                fase_id=fase_id,
                models=target_models,
                **pred_params
            )

            predicted_value = predictions.get(target_key)
            if predicted_value is None or (isinstance(predicted_value, float) and np.isnan(predicted_value)):
                continue

            valor_real = float(actual_value)
            valor_predicho = float(predicted_value)

            points.append({
                'codigo': row.get('codigo', ''),
                'proyecto': row.get('nombre_proyecto', ''),
                'alcance': row.get('alcance', ''),
                'longitud_km': float(row.get('longitud_km') or 0),
                'valor_real': valor_real,
                'valor_predicho': valor_predicho
            })

            real_values.append(valor_real)
            predicted_values.append(valor_predicho)

        # Métricas de error
        summary = {'count': len(points), 'mae': None, 'rmse': None, 'r2': None}

        print(len(points))
        if len(points) >= 2:
            real_array = np.array(real_values)
            pred_array = np.array(predicted_values)

            summary['mae'] = float(np.mean(np.abs(real_array - pred_array)))
            summary['rmse'] = float(sqrt(np.mean((real_array - pred_array) ** 2)))

            ss_res = np.sum((real_array - pred_array) ** 2)
            ss_tot = np.sum((real_array - real_array.mean()) ** 2)
            summary['r2'] = float(1 - ss_res / ss_tot) if ss_tot > 0 else None

        # Línea ideal (y = x)
        if points:
            min_value = float(min(real_values + predicted_values))
            max_value = float(max(real_values + predicted_values))
            ideal_line = {'x': [min_value, max_value], 'y': [min_value, max_value]}
        else:
            ideal_line = None

        # Respuesta final
        return jsonify({
            'points': points,
            'ideal_line': ideal_line,
            'summary': summary,
            'metadata': {
                'item_nombre': fase_item_req.descripcion,
                'fase_id': fase_id,
                'fase': fase.nombre,
                'modelo_disponible': True,
                'alcance': alcance_filter,
                'predictor_name': 'LONGITUD KM'
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@charts_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'charts'})
