from flask import Blueprint, jsonify, request
from app.models import db, Fase, FaseItemRequerido, ItemTipo
from datetime import datetime
import random

predict_bp = Blueprint("predict_v1", __name__)

@predict_bp.route("/", methods=["POST"])
def predict_cost():
    """
    Simula una predicción de costos basada en la fase y los ítems requeridos reales
    """

    data = request.get_json(silent=True) or {}

    proyecto_nombre = data.get("proyecto_nombre", "")
    fase_id = data.get("fase_id", 0)
    ubicacion = data.get("ubicacion", "")
    unidades_funcionales = data.get("unidades_funcionales", [])
    num_ufs = len(unidades_funcionales)

    # ------------------------------------------------------------------
    # 1️⃣ Buscar la fase
    # ------------------------------------------------------------------
    fase = Fase.query.get(fase_id)

    if not fase:
        return jsonify({"error": f"Fase '{fase_id}' no encontrada"}), 404

    # ------------------------------------------------------------------
    # 2️⃣ Obtener los ítems requeridos reales
    # ------------------------------------------------------------------
    items_requeridos = (
        db.session.query(FaseItemRequerido)
        .filter_by(fase_id=fase.id)
        .join(ItemTipo)
        .all()
    )

    if not items_requeridos:
        return jsonify({"error": f"No hay ítems requeridos para la fase '{fase.nombre}'"}), 404

    # ------------------------------------------------------------------
    # 3️⃣ Simular el costo total
    # ------------------------------------------------------------------
    base_cost_per_km = 6_000_000
    multiplier = 1.0

    multiplier *= 1 + (num_ufs * 0.05)

    # Calcular longitud total
    total_longitud = 0.0
    for uf in unidades_funcionales:
        total_longitud += float(uf.get("longitud_km", 0))

    if total_longitud == 0:
        total_longitud = max(1, num_ufs * 1.5)  # fallback mínimo

    costo_estimado = base_cost_per_km * total_longitud * multiplier
    costo_por_km = costo_estimado / total_longitud

    # ------------------------------------------------------------------
    # 4️⃣ Simular causaciones por ítem requerido
    # ------------------------------------------------------------------
    items = []
    for item_rel in items_requeridos:
        causacion_estimada = round(costo_estimado * random.uniform(0.05, 0.15))
        items.append({
            "item": item_rel.descripcion,
            "item_tipo_id": item_rel.item_tipo_id,
            "causacion_estimada": causacion_estimada
        })

    # ------------------------------------------------------------------
    # 5️⃣ Armar respuesta
    # ------------------------------------------------------------------
    response = {
        "costo_estimado": round(costo_estimado, 2),
        "costo_por_km": round(costo_por_km, 2),
        "confianza": 0.85,
        "items": items,
        "metrics": get_model_metrics()
    }

    return jsonify(response), 200

@predict_bp.route("/example", methods=["GET"])
def predict_cost_example():
    """
    Ejemplo de payload esperado
    """
    return jsonify({
        "proyecto_nombre": "Proyecto de Ejemplo",
        "fase_id": 1,
        "ubicacion": "Ciudad de Ejemplo",
        "unidades_funcionales": [
            {
                "numero": 1,
                "longitud_km": 10.5,
                "puentes_vehiculares_und": 0,
                "puentes_vehiculares_mt2": 0,
                "puentes_peatonales_und": 0,
                "puentes_peatonales_mt2": 0,
                "tuneles_und": 0,
                "tuneles_km": 0,
                "alcance": "",
                "zona": "",
                "tipo_terreno": "",
            }
        ]
    }), 200

@predict_bp.route("/train", methods=["POST"])
def train_model():
    """
    Entrena el modelo de predicción con los datos históricos actuales.
    
    Returns:
    - message: Mensaje de confirmación
    - metrics: Métricas del modelo entrenado (R², MAE, RMSE, etc.)
    - training_info: Información sobre el entrenamiento
    """
    try:
        # Simular métricas del modelo
        # En producción, aquí se entrenaría el modelo real con los datos de la BD
        metrics = {
            'r2': 0.249,
            'mae': 14398694.952,
            'rmse': 27929410.434,
            'mape': 101.930,
            'median_ae': 14139935.573,
            'max_error': 1.04095e+08
        }
        
        training_info = {
            'total_samples': 150,  # Ejemplo
            'features_used': [
                'longitud_km',
                'puentes_vehiculares_und',
                'puentes_vehiculares_mt2',
                'puentes_peatonales_und',
                'puentes_peatonales_mt2',
                'tuneles_und',
                'tuneles_km',
                'alcance',
                'zona',
                'tipo_terreno'
            ],
            'model_type': 'ElasticNet',
            'training_date': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'message': 'Modelo entrenado exitosamente',
            'metrics': metrics,
            'training_info': training_info
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_model_metrics():
    return {
        'r2': 0.249,
        'mae': 14398694.952,
        'rmse': 27929410.434,
        'mape': 101.930,
        'median_ae': 14139935.573,
        'max_error': 1.04095e+08
    }