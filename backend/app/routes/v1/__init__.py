from flask import Blueprint
from .proyectos import proyectos_bp
from .predict import predict_bp

def register_v1_blueprints(app):
    api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

    api_v1.register_blueprint(proyectos_bp, url_prefix="/proyectos")
    # api_v1.register_blueprint(unidades_bp, url_prefix="/unidades-funcionales")
    # api_v1.register_blueprint(fases_bp, url_prefix="/fases")
    # api_v1.register_blueprint(items_bp, url_prefix="/items")
    api_v1.register_blueprint(predict_bp, url_prefix="/predict")
    # api_v1.register_blueprint(reportes_bp, url_prefix="/reportes")

    app.register_blueprint(api_v1)
