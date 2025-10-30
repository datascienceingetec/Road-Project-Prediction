from flask import Blueprint
from .proyectos import proyectos_bp
from .fases import fases_bp
from .items import items_bp
from .predict import predict_bp
from .enums import enums_bp

def register_v1_blueprints(app):
    api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

    api_v1.register_blueprint(proyectos_bp, url_prefix="/proyectos")
    api_v1.register_blueprint(fases_bp, url_prefix="/fases")
    api_v1.register_blueprint(items_bp, url_prefix="/items")
    api_v1.register_blueprint(predict_bp, url_prefix="/predict")
    api_v1.register_blueprint(enums_bp, url_prefix="/enums")
    # api_v1.register_blueprint(reportes_bp, url_prefix="/reportes")

    app.register_blueprint(api_v1)
