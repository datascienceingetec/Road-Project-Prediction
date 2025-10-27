from flask import Blueprint, jsonify, request

fases_bp = Blueprint("fases_v1", __name__)

@fases_bp.route('/', methods=['GET'], strict_slashes=False)
def get_fases():
    return jsonify({'fases': ['fase_i', 'fase_ii', 'fase_iii']})

def get_fase(fase):
    pass

def get_fase_items(fase):
    pass