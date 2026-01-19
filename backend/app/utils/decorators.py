from functools import wraps
from flask import request, jsonify, g
import jwt
from jwt import InvalidTokenError
from app.config import Config
from app.services.auth_service import User


def require_authenticated_user(f):
    # TODO: Adaptar e implementar en middleware o endpoints
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get("roadcost_session")
        if not token:
            return jsonify({"error": "Unauthorized"}), 401
        try:
            payload = jwt.decode(token, Config.SECRET_KEY,
                                 algorithms=["HS256"])
        except InvalidTokenError:
            return jsonify({"error": "Invalid session"}), 401
        g.user = User(**payload)
        return f(*args, **kwargs)

    return decorated


def require_category_id(category_id: str):
    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(g, "user", None)
            if not user:
                return jsonify({"error": "Unauthorized"}), 401
            if user.employeeCategorieId != category_id:
                return jsonify({"error": "Forbidden"}), 403
            return f(*args, **kwargs)

        return decorated

    return wrapper
