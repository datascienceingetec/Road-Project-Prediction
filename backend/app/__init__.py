from flask import Flask
from flask_cors import CORS
from .config import Config
from .routes import register_blueprints

def create_app():
    app = Flask(
        __name__,
        instance_relative_config=True,
        template_folder="templates",
        static_folder="static"
    )
    # CORS(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

    app.config.from_object(Config)

    register_blueprints(app)

    return app