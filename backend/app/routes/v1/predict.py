from flask import Blueprint, jsonify, request
from app.services import PredictionService
from app.services import ModelService
from app.services.exceptions import PhaseNotFoundError, MissingItemsError
from werkzeug.exceptions import BadRequest
import traceback

predict_bp = Blueprint("predict_v1", __name__)

# Initialize services
prediction_service = PredictionService()
model_service = ModelService()

@predict_bp.route("/", methods=["POST"])
def predict_cost():
    """
    Make cost predictions for a project using trained models.
    
    This endpoint uses the adapter pattern to work with trained models.
    It processes predictions per functional unit and aggregates results.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'El cuerpo de la solicitud debe ser un JSON válido.'}), 400

    try:
        result = prediction_service.predict_cost(data)
        return jsonify(result), 200

    except (BadRequest, MissingItemsError) as e:
        return jsonify({'error': str(e)}), 400
    
    except (PhaseNotFoundError, FileNotFoundError) as e:
        return jsonify({'error': str(e)}), 404

    except Exception as e:
        print(f"Error in prediction: {e}")
        print(traceback.format_exc())
        return jsonify({'error': f"Error al realizar la predicción: {str(e)}"}), 500


@predict_bp.route("/models/available", methods=["GET"])
def get_available_models():
    """
    Get list of available trained models.
    
    Response:
    {
        "models": [
            {"fase": "II", "fase_id": 2, "available": true, "metadata": {...}},
            {"fase": "III", "fase_id": 3, "available": true, "metadata": {...}}
        ]
    }
    """
    try:
        models_info = model_service.get_available_models()
        return jsonify({'models': models_info}), 200
        
    except Exception as e:
        print(f"Error checking available models: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


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
def train_models():
    """
    Train models for a specific phase and save them to disk.
    
    Request body:
    {
        "fase_id": 3  // Phase ID from database
    }
    
    Response:
    {
        "success": true,
        "fase": "III",
        "fase_id": 3,
        "models_path": "data/models/fase_III_models.pkl",
        "summary": [...],  // Training metrics summary
        "metadata": {...}  // Training metadata
    }
    """
    data = request.get_json(silent=True)
    if not data:
        raise BadRequest("El cuerpo de la solicitud debe ser un JSON válido.")
    
    fase_id = data.get("fase_id")
    if not fase_id:
        raise BadRequest("El campo 'fase_id' es requerido.")
    
    try:
        result = model_service.train_models(fase_id)
        
        # Convert summary DataFrame to dict if present
        summary = None
        if result.get('summary') is not None:
            summary = result['summary'].to_dict(orient='records')
        
        return jsonify({
            "success": True,
            "fase": result['fase'],
            "fase_id": result['fase_id'],
            "models_path": result['models_path'],
            "summary": summary,
            "metadata": result.get('metadata')
        }), 200
        
    except NotImplementedError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 501
        
    except Exception as e:
        print(f"Error training models: {e}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": f"Error al entrenar modelos: {str(e)}"
        }), 500        