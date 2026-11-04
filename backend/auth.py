import jwt
from fastapi import Header, HTTPException

from config import settings


def get_current_user(authorization: str | None = Header(default=None)) -> str:
    """Validate the Supabase Auth JWT and return its user id (UUID)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ")

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id
