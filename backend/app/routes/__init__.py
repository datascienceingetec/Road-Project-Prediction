from .v1 import register_v1_blueprints

def register_blueprints(app):
    register_v1_blueprints(app)