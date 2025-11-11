import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
INSTANCE_DIR = os.path.join(PROJECT_ROOT, "instance")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
LOGS_DIR = os.path.join(PROJECT_ROOT, "logs")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    DATABASE = os.path.join(INSTANCE_DIR, "database.db")
    OLD_DATABASE = os.path.join(INSTANCE_DIR, "old_database.db")
    
    # SQLAlchemy configuration
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(INSTANCE_DIR, 'database.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "False").lower() == "true"
    
    BASE_DIR = BASE_DIR
    PROJECT_ROOT = PROJECT_ROOT
    INSTANCE_DIR = INSTANCE_DIR
    DATA_DIR = DATA_DIR
    LOGS_DIR = LOGS_DIR
