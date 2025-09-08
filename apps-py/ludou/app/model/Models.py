from datetime import datetime, timezone

from sqlalchemy import func
from sqlmodel import Field, SQLModel, select

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password: str
    avatar: str
    vip_first:bool
    wallet_first:bool
    invite_code: str = Field(index=True, unique=True)
    invite_by: str | None = Field(index=True,default=None)
    is_admin: bool = Field(default=False)
    level: int = Field(default=0)
    balance: float = Field(default=0.0)
    balance_withdraw: float = Field(default=0.0)
    vip_expired_at: int = Field(default=0)
    created_at: int


class UserInvite(SQLModel, table=True):
    __tablename__ = "user_invite"
    id: int | None = Field(default=None, primary_key=True)
    uid: int = Field(foreign_key="user.id", index=True)  # 添加索引
    uid_by: int = Field(foreign_key="user.id", index=True)  # 添加索引
    created_at: int = Field(index=True)  # 添加索引

    @classmethod
    def daily_count(cls, session, uid: int) -> int:
        """
        获取用户当天的邀请数量
        """
        # 获取当天开始和结束的时间戳（UTC时间）
        now_utc = datetime.now(timezone.utc)
        today_start_utc = datetime(now_utc.year, now_utc.month, now_utc.day, 0, 0, 0, tzinfo=timezone.utc)
        today_end_utc = datetime(now_utc.year, now_utc.month, now_utc.day, 23, 59, 59, tzinfo=timezone.utc)

        today_start_ts = int(today_start_utc.timestamp())
        today_end_ts = int(today_end_utc.timestamp())

        # 查询当天邀请数量
        statement = select(func.count(cls.id)).where(
            cls.uid_by == uid,
            cls.created_at >= today_start_ts,
            cls.created_at <= today_end_ts
        )

        return session.exec(statement).one()

class Video(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    content:str
    id_key: str = Field(index=True, unique=True)
    path:str
    width: int
    height: int
    width_m: int
    height_m: int
    created_at:int
    size:float
    duration:float
    mime_type:str

class Order(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    uid:int
    order_no: str = Field(index=True, unique=True)
    order_type:str
    amount:float
    amount_real: float = Field(default=0.0)
    add_first:int = Field(default=0)
    status:int = Field(default=0)
    pay_method:str
    order_info:str
    created_at: int
    updated_at: int


class OrderTickets(SQLModel, table=True):
    __tablename__ = "order_tickets"
    id: int | None = Field(default=None, primary_key=True)
    uid:int
    is_owner:bool
    order_id:int
    text:str = Field(default="")
    img:str = Field(default="")
    created_at: int

class OrderTicketsSession(SQLModel, table=True):
    __tablename__ = "order_tickets_session"
    id: int | None = Field(default=None, primary_key=True)
    uid:int
    order_id: int = Field(unique=True,index=True)
    status:int = Field(default=0)
    text:str = Field(default="")
    is_reply:bool = Field(default=False)
    updated_at: int


class PayQrcode(SQLModel, table=True):
    __tablename__ = "pay_qrcode"
    id: int | None = Field(default=None, primary_key=True)
    img:str = Field(default="")
    status:int = Field(default=0)
    created_at: int


class AccountActivity(SQLModel, table=True):
    __tablename__ = "account_activity"
    id: int | None = Field(default=None, primary_key=True)
    uid:int
    kind:str
    info:str
    amount:float = Field(default=0.0)
    pre_amount:float = Field(default=0.0)
    extra_info:str|None = Field(default=None)
    created_at: int
