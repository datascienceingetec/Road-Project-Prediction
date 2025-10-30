from flask import Flask
from flask_cors import CORS
from .config import Config
from .routes import register_blueprints
from .models import db
import os

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
    
    # Ensure instance folder exists
    os.makedirs(app.config['INSTANCE_DIR'], exist_ok=True)
    
    # Initialize SQLAlchemy
    db.init_app(app)
    
    # NOTE: Database tables are now managed by Alembic migrations
    # To create/update tables, use: alembic upgrade head
    # See docs/ALEMBIC_MIGRATION_GUIDE.md for details

    register_blueprints(app)

    return app