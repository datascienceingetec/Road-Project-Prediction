# app/config/utils.py
import os


class ImproperlyConfigured(RuntimeError):
    pass


def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ImproperlyConfigured(
            f"Environment variable '{name}' is required but not set"
        )
    return value
