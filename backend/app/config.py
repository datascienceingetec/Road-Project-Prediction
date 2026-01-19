import os
from app.utils.config import required_env

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

    # Base de datos
    DATABASE = os.path.join(INSTANCE_DIR, "database.db")
    OLD_DATABASE = os.path.join(INSTANCE_DIR, "old_database.db")

    SQLALCHEMY_DATABASE_URI = (
        f"sqlite:///{os.path.join(INSTANCE_DIR, 'database.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"

    BASE_DIR = BASE_DIR
    PROJECT_ROOT = PROJECT_ROOT
    INSTANCE_DIR = INSTANCE_DIR
    DATA_DIR = DATA_DIR
    LOGS_DIR = LOGS_DIR
