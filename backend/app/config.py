import os

from app.adapters.storage import GCSStorage, LocalStorage
from app.utils.config import required_env
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
INSTANCE_DIR = os.path.join(PROJECT_ROOT, "instance")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
LOGS_DIR = os.path.join(PROJECT_ROOT, "logs")


class Config:
    # Seguridad
    SECRET_KEY = required_env("SECRET_KEY")
    JWT_SECRET = required_env("JWT_SECRET")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRES_MINUTES = 15
    SECURE_COOKIE = os.getenv("SECURE_COOKIE", "false").lower() == "true"

    LOGIN_REDIRECT_URL = os.getenv("LOGIN_REDIRECT_URL")
    ALLOWED_ORIGINS = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000").split(",")

    # Gestiona / SSO
    GESTIONA_API_URL = required_env("GESTIONA_API_URL")
    ALLOWED_CATEGORIES_ID = required_env("ALLOWED_CATEGORIES_ID").split(",")
    ALLOWED_DEPARTMENTS = required_env("ALLOWED_DEPARTMENTS").split(",")
    ADMIN_USERS = os.getenv("ADMIN_USERS", "").split(",")

    # Storage
    GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

    # Base de datos (SQLite) para dev notebooks
    DATABASE = os.path.join(INSTANCE_DIR, "database.db")
    OLD_DATABASE = os.path.join(INSTANCE_DIR, "old_database.db")

    SQLALCHEMY_DATABASE_URI = required_env("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"

    # Configuración del pool de conexiones (optimizado para Neon PostgreSQL)
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
        "pool_pre_ping": True,  # Verifica conexiones antes de usarlas
        "pool_recycle": 3600,   # Recicla conexiones cada hora
    }

    BASE_DIR = BASE_DIR
    PROJECT_ROOT = PROJECT_ROOT
    INSTANCE_DIR = INSTANCE_DIR
    DATA_DIR = DATA_DIR
    LOGS_DIR = LOGS_DIR


def get_storage():
    if Config.GCS_BUCKET_NAME:
        return GCSStorage(bucket_name=Config.GCS_BUCKET_NAME)
    return LocalStorage()
