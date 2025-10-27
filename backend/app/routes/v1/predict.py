from flask import Blueprint, jsonify, request

predict_bp = Blueprint("predict_v1", __name__)

@predict_bp.route('/', methods=['POST'], strict_slashes=False)
def predict_cost():
    data = request.get_json(silent=True) or {}
    longitud = data.get('longitud', 0)
    num_ufs = data.get('num_ufs', 0)
    prediction = longitud * 50000 * (1 + num_ufs * 0.1)
    return jsonify({'costo_predicho': round(prediction, 2)})