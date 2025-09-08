import logging
import os
import time
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlparse, parse_qs

from fastapi import HTTPException, Header, Depends, APIRouter
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlmodel import select
import random
import string

from ..config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from ..db import SessionDep
from ..dependencies import get_bearer_token_header
from ..model.Models import User, UserInvite, AccountActivity

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

router = APIRouter(
    prefix="/api/auth",
    dependencies=[Depends(get_bearer_token_header)],
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)

class TokenRequest(BaseModel):
    username: str
    password: str
    invite_code: Optional[str] = None
    is_reg: Optional[bool] = Field(default=False, description="Whether this is a registration request")

    # Optional: Add validation to handle None values
    def __init__(self, **data):
        # Convert None to False for is_reg
        if 'is_reg' in data and data['is_reg'] is None:
            data['is_reg'] = False
        super().__init__(**data)


class ErrorResponse(BaseModel):
    err_msg: str

class TokenResponse(BaseModel):
    user:User
    access_token: str
    token_type: str


class AuthUser(BaseModel):
    username: str
    password: str  # In real app, this should be hashed

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    logger.info(datetime.utcnow().timestamp())
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES * 2 * 24 * 7)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt,expire


@router.post("/sign", response_model=TokenResponse| ErrorResponse)
async def auth_sign(request: TokenRequest,session: SessionDep):
    is_reg = request.is_reg
    invite_code = request.invite_code
    statement = select(User).where(User.username == request.username)
    result = session.exec(statement)
    user = result.first()
    logger.info("[auth_login] request: %s ,user: %s",request,user)
    current_time = int(time.time())

    if is_reg is True:
        if user:
            return ErrorResponse(
                err_msg="用户已存在"
            )
        random_string = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        vip_expired_at = 0
        invite_by = None
        user1 = None
        if invite_code is not None:
            statement1 = select(User).where(User.invite_code == invite_code)
            result1 = session.exec(statement1)
            user1 = result1.first()
            logger.info("user1:%s",user1)
            if user1 is not None:
                invite_by = user1.invite_code
                current_vip_expired = user1.vip_expired_at

                if current_vip_expired < current_time:
                    user1.vip_expired_at = current_time + 3600 * 24
                else:
                    user1.vip_expired_at = current_vip_expired + 3600 * 24
                vip_expired_at = current_time + 3600 * 24
                daily_invite_count = UserInvite.daily_count(session,user1.id)
                logger.info("daily_invite_count %d",daily_invite_count)

                aa = AccountActivity(
                    uid=user1.id,
                    kind="invite_add",
                    info=f"邀请:***{request.username[-3:]},VIP加赠一天",
                    extra_info=f"username:{request.username}",
                    created_at = current_time
                )
                session.add(aa)
                if UserInvite.daily_count(session,user1.id) == 5:
                    logger.info("gift 24 day vip")
                    aa = AccountActivity(
                        uid=user1.id,
                        kind="invite_add",
                        info="单日邀请6人,VIP加赠24天",
                        created_at = current_time
                    )
                    session.add(aa)
                    user1.vip_expired_at = user1.vip_expired_at + 3600 * 24 * 24

                session.add(user1)

        user = User(
            username=request.username,
            password=request.password,
            avatar="1",
            wallet_first=True,
            vip_first=True,
            invite_code=random_string.lower(),
            invite_by=invite_by,
            is_admin=False,
            level=0,
            balance=0.0,
            vip_expired_at=vip_expired_at,
            created_at=current_time
        )

        session.add(user)
        session.commit()
        session.refresh(user)
        logger.info("[reg] user: %s",user)
        if user1 is not None:
            user_invite = UserInvite(
                uid = user.id,
                uid_by = user1.id,
                created_at = current_time
            )
            session.add(user_invite)

            aa = AccountActivity(
                uid=user.id,
                kind="invite_add",
                info=f"被邀请,VIP加赠一天",
                extra_info=f"uid:{user1.id}",
                created_at = current_time
            )
            session.add(aa)

            session.commit()
            session.refresh(user_invite)
            logger.info("[reg] user_invite: %s",user_invite)
    else:
        if not user:
            return ErrorResponse(
                err_msg="用户不存在"
            )
        if user.password != request.password:
            return ErrorResponse(
                err_msg="密码不正确"
            )

    token_data = {
        "sub": user.username,
        "uid": user.id,
    }

    access_token,expire = create_access_token(token_data)
    user.password = ""
    return TokenResponse(
        user=user,
        access_token=access_token,
        token_type="bearer",
    )

@router.get("/validate")
async def validate_auth(x_original_uri: Optional[str] = Header(None)):
    logger.info("x_original_uri:%s",x_original_uri)
    if not x_original_uri:
        raise HTTPException(status_code=400, detail="X-Original-URI header is missing")
    token = None
    try:
        parsed_url = urlparse(x_original_uri)
        query_params = parse_qs(parsed_url.query)
        if 'token' in query_params:
            token = query_params['token'][0]  # parse_qs returns lists for each parameter
    except Exception as e:
        pass
    logger.info("token:%s",token)

    if not token:
        raise HTTPException(
            status_code=401,
            detail=f"No token found in X-Original-URI: {x_original_uri}"
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info("payload:%s",payload)

        return {
            "username": payload.get("sub"),
            "expires": datetime.fromtimestamp(payload.get("exp")).isoformat()
        }
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

class ManageRequest(BaseModel):
    token: str

@router.post("/manage", response_model=dict)
async def auth_sign(request: ManageRequest,session: SessionDep):
    ACCESS_TOKEN = os.getenv("ACCESS_TOKEN","")
    if ACCESS_TOKEN != request.token:
        raise HTTPException(status_code=401, detail="token invalid")

    user = session.exec(select(User).where(User.username == "13111111111")).first()
    user.is_admin = True
    session.add(user)
    session.commit()
    session.refresh(user)
    user.password = ""
    return {"v":"1","user":user}