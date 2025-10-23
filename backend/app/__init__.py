from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app():
    app = Flask(
        __name__,
        instance_relative_config=True,
        template_folder="templates",
        static_folder="static"
    )
    CORS(app)

    app.config.from_object(Config)

    from .routes import api
    app.register_blueprint(api, url_prefix="/api")

    return app