from flask import Blueprint, jsonify, request
from app.models import ITEM_MODELS

items_bp = Blueprint("items_v1", __name__)

@items_bp.route('/', methods=['GET'], strict_slashes=False)
def get_items():
    return jsonify({'items': ['item_i', 'item_ii', 'item_iii']})

def get_item(item):
    pass

def search_items(query):
    pass