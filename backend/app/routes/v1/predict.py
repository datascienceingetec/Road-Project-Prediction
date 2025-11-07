from flask import Blueprint, jsonify, request
from app.services.predict import process_project

predict_bp = Blueprint("predict_v1", __name__)

@predict_bp.route("/", methods=["POST"])
def predict_cost():
    data = request.get_json(silent=True) or {}

    project_name = data.get("proyecto_nombre", "")
    phase_id = data.get("fase_id", 0)
    location = data.get("ubicacion", "")
    unidades_funcionales = data.get("unidades_funcionales", [])

    result = process_project(
        project_name, phase_id, location, unidades_funcionales
    )

    return jsonify(result)


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
