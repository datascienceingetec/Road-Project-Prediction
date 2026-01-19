from app.services.gestiona_api import GestionaAPIError
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt
from app.config import Config
from app.services import gestiona_api


class AuthenticationError(Exception):
    pass


class NotAuthorizedError(AuthenticationError):
    pass


class InvalidTokenError(AuthenticationError):
    pass


class ExternalServiceError(AuthenticationError):
    pass


@dataclass
class User:
    employeeID: Optional[str]
    employeeName: Optional[str]
    employeeLastName: Optional[str]
    employeeCategorie: Optional[str]          # rol / categoria
    employeeCategorieId: Optional[str]        # id de la categoria
    employeeDepartment: Optional[str]         # departamento
    employeeMail: Optional[str]
    employeePicture: Optional[str]


def safe_strip(value: Any) -> Optional[str]:
    if isinstance(value, str):
        return value.strip()
    return None


def build_user(user_info: dict) -> User:
    def get_val(key): return safe_strip(user_info.get(key))

    email_prefix = get_val("employeeMail")
    email = f"{email_prefix.lower()}@ingetec.com.co" if email_prefix else None

    return User(
        employeeID=user_info.get("employeeID"),
        employeeName=get_val("employeeName"),
        employeeLastName=get_val("employeeLastName"),
        employeeCategorie=get_val("employeeCategorie"),
        employeeCategorieId=user_info.get("employeeCategorieID"),
        employeeDepartment=get_val("employeeDepartment"),
        employeeMail=email,
        employeePicture=get_val("employeePicture"),
    )


def _is_authorized(user: User) -> bool:
    is_admin = user.employeeMail in Config.ADMIN_USERS
    if is_admin:
        return True
    return user.employeeCategorieId in Config.ALLOWED_CATEGORIES_ID and user.employeeDepartment in Config.ALLOWED_DEPARTMENTS


def authenticate_user(auth_code: str) -> Dict[str, Any]:
    """Perform full authentication flow:

    1. Exchange auth code for corporate token via Gestiona
    2. Retrieve user info from Gestiona
    3. Validate authorization
    4. Return user info and corporate token if authorized
    """
    try:
        token_resp = gestiona_api.exchange_auth_code(auth_code)
    except GestionaAPIError as e:
        raise ExternalServiceError() from e

    token = token_resp.get("access_token") if isinstance(
        token_resp, dict) else None
    if not token:
        raise AuthenticationError("Failed to get token")

    try:
        users = gestiona_api.get_user_by_token(token)
    except GestionaAPIError as e:
        raise ExternalServiceError() from e

    if not users:
        raise InvalidTokenError()

    user = build_user(users[0])

    if not _is_authorized(user):
        raise NotAuthorizedError()

    # --- JWT ---
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.employeeID,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=Config.JWT_EXPIRES_MINUTES)).timestamp()),
        "iss": "gestiona",
        "aud": "road-project-prediction",
        "user": asdict(user)
    }

    session_token = jwt.encode(
        payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM
    )

    return {
        "session_token": session_token,
        "user": user,
        "session": {k: v for k, v in payload.items() if k != "user"},
    }
