from flask import Blueprint, request, jsonify, current_app, make_response
import jwt
from jwt import InvalidTokenError
from app.services import auth_service
from app.services.auth_service import (
    AuthenticationError,
    NotAuthorizedError,
    InvalidTokenError,
    ExternalServiceError,
)
from app.config import Config

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/google", methods=["POST"])
def google_auth():
    data = request.get_json(silent=True) or {}
    code = data.get("code")

    if not code:
        return jsonify({"error": "Missing code"}), 400

    try:
        result = auth_service.authenticate_user(code)

    except NotAuthorizedError:
        return jsonify({"error": "Usuario no autorizado"}), 403

    except InvalidTokenError:
        return jsonify({"error": "Credenciales inválidas"}), 401

    except ExternalServiceError:
        return jsonify({"error": "Servicio de autenticación no disponible"}), 502

    except AuthenticationError:
        return jsonify({"error": "Authentication failed"}), 401

    except Exception:
        return jsonify({"error": "Internal server error"}), 500

    resp = make_response(jsonify({
        "user": result["user"],
        "session": result["session"],
    }))

    resp.set_cookie(
        "roadcost_session",
        result["session_token"],
        httponly=True,
        secure=Config.SECURE_COOKIE,
        samesite="None" if Config.SECURE_COOKIE else "Lax",
        max_age=Config.JWT_EXPIRES_MINUTES * 60,
        path="/",
    )

    return resp


@auth_bp.route("/me", methods=["GET"])
def me():
    token = request.cookies.get("roadcost_session")
    if not token:
        return make_response(jsonify({"error": "No session"}), 401)

    try:
        payload = jwt.decode(
            token,
            Config.JWT_SECRET,
            algorithms=[Config.JWT_ALGORITHM],
            audience="road-project-prediction",
            issuer="gestiona",
        )
    except InvalidTokenError:
        resp = make_response(jsonify({"error": "Invalid session"}), 401)
        return clear_session_cookie(resp)

    session_info = {k: v for k, v in payload.items() if k != "user"}
    return jsonify({
        "user": payload.get("user"),
        "session": session_info
    })


@auth_bp.route("/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"message": "Logged out"}), 200)
    return clear_session_cookie(resp)


def clear_session_cookie(response):
    response.set_cookie(
        "roadcost_session",
        "",
        expires=0,
        max_age=0,
        httponly=True,
        secure=Config.SECURE_COOKIE,
        samesite="None" if Config.SECURE_COOKIE else "Lax",
        path="/",
    )
    return response
