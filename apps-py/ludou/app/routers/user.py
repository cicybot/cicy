import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import aliased
from sqlmodel import select

from ..db import SessionDep
from ..dependencies import get_bearer_token_header, get_current_uid
from ..model.Models import UserInvite, User, AccountActivity

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/user",
    tags=["user"],
    dependencies=[Depends(get_bearer_token_header)],
    responses={404: {"description": "Not found"}},
)

class InviteUser(BaseModel):
    id: int
    uid: int
    uid_by: int
    username: str  # 被邀请用户的用户名
    created_at: int


class AvatarRequest(BaseModel):
    avatar: str

@router.get("/activity/list")
def activity_list(
    session: SessionDep,
    uid: int = Depends(get_current_uid)
) -> list[AccountActivity]:
    rows = session.exec(
        select(AccountActivity).where(AccountActivity.uid == uid).order_by(AccountActivity.created_at.desc())
    ).all()
    return rows

@router.post("/avatar/update")
def user_update_avatar(
        request:AvatarRequest,
        session: SessionDep,
        uid: int = Depends(get_current_uid)
) -> User:
    statement1 = select(User).where(User.id == uid)
    result1 = session.exec(statement1)
    user1 = result1.first()
    user1.avatar =request.avatar
    session.add(user1)
    session.commit()
    session.refresh(user1)
    return user1

@router.get("/invite/list")
def invite_list(
    session: SessionDep,
    uid: int = Depends(get_current_uid)
) -> list[InviteUser]:
    # 创建别名以便区分
    invited_user = aliased(User)

    # 使用join查询
    statement = (
        select(
            UserInvite.id,
            UserInvite.uid,
            UserInvite.uid_by,
            invited_user.username,  # 获取被邀请用户的用户名
            UserInvite.created_at
        )
        .join(invited_user, UserInvite.uid == invited_user.id)  # 左连接User表
        .where(UserInvite.uid_by == uid)
        .order_by(UserInvite.created_at.desc())
    )

    rows = session.exec(statement).all()
    return rows

@router.get("/invite/daily/count")
def invite_daily_count(
    session: SessionDep,
    uid: int = Depends(get_current_uid)
) -> int:
    return UserInvite.daily_count(session, uid)




