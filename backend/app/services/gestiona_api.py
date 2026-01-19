import requests
from typing import Dict, Any

from app.config import Config

TIMEOUT = 5


class GestionaAPIError(Exception):
    pass


def exchange_auth_code(auth_code: str) -> Dict[str, Any]:
    """Exchange Google auth code via Gestiona and return corporate token info.

    Expected to call: GET /LoginGoogle/GetToken?authcode=<>&strUrl=<> and return JSON with token.
    """
    url = f"{Config.GESTIONA_API_URL}/LoginGoogle/GetToken"
    params = {"authcode": auth_code, "strUrl": Config.LOGIN_REDIRECT_URL}
    headers = {"Content-Type": "application/json",
               "Accept": "application/json"}

    try:
        resp = requests.get(url, params=params,
                            headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise GestionaAPIError(f"Error contacting Gestiona GetToken: {e}")

    if resp.status_code != 200:
        raise GestionaAPIError(
            f"Gestiona GetToken returned status {resp.status_code}")

    try:
        data = resp.json()
    except ValueError:
        raise GestionaAPIError("Invalid JSON from Gestiona GetToken")

    return data


def get_user_by_token(token: str) -> list:
    """Get user information from Gestiona using the corporate token.

    Expected to call: GET /LoginGoogle/tokenUser?strToken=<token>
    """
    url = f"{Config.GESTIONA_API_URL}/LoginGoogle/tokenUser"
    params = {"strToken": token}
    headers = {"Content-Type": "application/json",
               "Accept": "application/json"}
    try:
        resp = requests.get(url, params=params,
                            headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise GestionaAPIError(f"Error contacting Gestiona tokenUser: {e}")

    if resp.status_code != 200:
        raise GestionaAPIError(
            f"Gestiona tokenUser returned status {resp.status_code}")

    try:
        data = resp.json()
    except ValueError:
        raise GestionaAPIError("Invalid JSON from Gestiona tokenUser")

    return data
