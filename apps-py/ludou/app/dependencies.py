import logging

from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlmodel import select

security = HTTPBearer(auto_error=False)
from .model.Models import User
from .db import SessionDep
from .config import SECRET_KEY,ALGORITHM
logger = logging.getLogger(__name__)

async def get_bearer_token_header(
        request: Request,
        credentials: HTTPAuthorizationCredentials = Depends(security)):

    url_path = request.url.path
    if  (url_path.startswith("/api/video/list")
            or url_path.startswith("/api/video/detail")
            or url_path.startswith("/api/auth/sign")
            or url_path.startswith("/api/auth/manage")
            or url_path.startswith("/api/app/settings")
            or url_path.startswith("/api/auth/validate")
            or url_path.startswith("/api/video/key")):
        request.state.uid = None
        return None
    else:
        if not credentials:
            raise HTTPException(status_code=401, detail="Authorization header required")

        token = credentials.credentials

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            request.state.uid = payload.get("uid")
            return payload.get("uid")
        except JWTError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_current_uid(request: Request) -> int | None:
    if not hasattr(request.state, 'uid') or request.state.uid is None:
        return None
    return request.state.uid


def check_admin(uid:int,session: SessionDep)->bool:
    user = session.exec(
        select(User).where(User.id == uid)
    ).first()
    if user is None:
        raise HTTPException(status_code=400, detail="user is null")

    if user.is_admin is False:
        raise HTTPException(status_code=400, detail="user is not Admin")
    return user