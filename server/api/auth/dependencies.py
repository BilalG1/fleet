from typing import Annotated, Any
from fastapi import Request, HTTPException, status, Depends
import json
import requests
from jose import jwt, jwk
from cachetools import TTLCache, cached
from .settings import config

JWKS_URL = f"https://api.stack-auth.com/api/v1/projects/{config.stack_project_id}/.well-known/jwks.json"


@cached(cache=TTLCache(maxsize=1, ttl=3600))
def fetch_jwks() -> list[dict[str, Any]]:
    response = requests.get(JWKS_URL)
    response.raise_for_status()
    jwks_data: list[dict[str, Any]] = response.json()
    return jwks_data


def get_authenticated_user_id(request: Request) -> str:
    auth_header = request.headers.get("x-stack-auth")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    try:
        access_token = json.loads(auth_header)["accessToken"]
        jwks = fetch_jwks() 
        unverified_header = jwt.get_unverified_header(access_token)
        key_data = next(k for k in jwks["keys"] if k["kid"] == unverified_header["kid"]) # type: ignore
        key = jwk.construct(key_data)
        payload = jwt.decode(access_token, key, algorithms=[key_data["alg"]], audience=config.stack_project_id)
        return payload["sub"] # type: ignore
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

AuthenticatedUserId = Annotated[str, Depends(get_authenticated_user_id)]

