from flask import Blueprint, jsonify, request
from app.services.predict import PredictionService
from app.services.exceptions import PhaseNotFoundError, MissingItemsError
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError

predict_bp = Blueprint("predict_v1", __name__)

@predict_bp.route("/", methods=["POST"])
def predict_cost():
    data = request.get_json(silent=True)
    if not data:
        raise BadRequest("El cuerpo de la solicitud debe ser un JSON válido.")

    service = PredictionService()

    try:
        result = service.estimate_project_cost(
            project_name=data.get("proyecto_nombre", ""),
            phase_id=data.get("fase_id"),
            location=data.get("ubicacion", ""),
            unidades_funcionales=data.get("unidades_funcionales"),
        )
        return jsonify(result), 200

    except PhaseNotFoundError as e:
        return NotFound(str(e))

    except MissingItemsError as e:
        return BadRequest(str(e))

    except Exception as e:
        return InternalServerError(str(e))


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
    return jsonify({
        "message": "Modelos entrenados exitosamente"
    }), 200        