import datetime
import json
import logging
import time
from typing import Optional, Annotated

import sqlmodel
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from ..db import SessionDep
from ..dependencies import get_bearer_token_header, get_current_uid, check_admin
from ..model.Models import Order, OrderTickets, User, AccountActivity, UserInvite, PayQrcode, OrderTicketsSession

logger = logging.getLogger(__name__)

import random

def generate_order_no():
    now = datetime.datetime.now()
    date_part = now.strftime("%Y%m%d%H%M%S")
    random_part = str(random.randint(0, 9999)).zfill(4)
    return f"{date_part}{random_part}"

router = APIRouter(
    prefix="/api/order",
    tags=["order"],
    dependencies=[Depends(get_bearer_token_header)],
    responses={404: {"description": "Not found"}},
)

class PayDetailRequest(BaseModel):
    id:int

class PayDetailResponse(BaseModel):
    pay_url:str
    pay_tips:str
    order:Order

class OrderCreateRequest(BaseModel):
    amount:float
    add_first: Optional[int] = None
    order_info:str
    order_type:str
    pay_method:str


def generate_unique_amount_real_v2(session: SessionDep, amount: float) -> float:
    """
    更高效的方法：先生成候选值，然后批量检查
    """
    # 获取所有status=0订单的amount_real值
    statement = select(Order.amount_real).where(Order.status == 0)
    existing_amounts = set(session.exec(statement).all())

    # 生成多个候选值
    candidates = [round(random.uniform(amount -1, amount), 2) for _ in range(10)]

    # 找出第一个不重复的值
    for candidate in candidates:
        if candidate not in existing_amounts:
            return candidate

    # 如果都重复，使用序列生成
    for i in range(1, 101):  # 从199.01到199.99
        candidate = amount - 1 + i * 0.01
        if candidate not in existing_amounts:
            return candidate

    # 最后的手段
    import time
    return round(amount - 1 + (time.time() % 1.0), 2)

@router.post("/create")
def create_order(request: OrderCreateRequest, session: SessionDep,
                 uid: int = Depends(get_current_uid)) -> Order:
    logger.info("create_order:%s,uid:%s",request,uid)
    created_at = int(time.time())

    amount_real = generate_unique_amount_real_v2(session,request.amount)
    order = Order(
        uid = uid,
        order_no=generate_order_no(),
        order_info = request.order_info,
        pay_method = request.pay_method,
        order_type = request.order_type,
        amount = request.amount,
        amount_real = amount_real,
        add_first = request.add_first,
        created_at = created_at,
        updated_at = created_at,
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order

@router.post("/detail")
def pay_detail(
        request: PayDetailRequest,
        session: SessionDep,
        uid: int = Depends(get_current_uid)
) -> PayDetailResponse:
    statement = select(Order).where(Order.id == request.id)
    result = session.exec(statement)
    order = result.first()
    if uid != order.uid:
        raise HTTPException(status_code=400, detail="order is not yours")
    pay_method = order.pay_method
    pay_tips = None

    # 获取状态为1的支付二维码
    qrcode_stmt = select(PayQrcode).where(PayQrcode.status == 1)
    qrcode_result = session.exec(qrcode_stmt)
    active_qrcode = qrcode_result.first()
    pay_url = active_qrcode.img if active_qrcode else None
    if pay_method == "alipay_qrcode":
        pay_url = pay_url
        pay_tips = f"""1.付款成功之后一般10分钟左右到帐
2.付款金额必须是 {order.amount_real} 否则无法处理订单
3.请保留好付款凭证截图，任何订单相关的问题请到 “我的订单” - “提交工单”，进行申诉
""".strip()
    return PayDetailResponse(
        order=order,
        pay_url=pay_url,
        pay_tips=pay_tips
    )

class OrderListResponse(BaseModel):
    total: int
    orders: list[Order]
    has_more: bool

@router.get("/list")
def order_list(
        session: SessionDep,
        offset: int = 0,
        status: int = 0,
        order_type: Optional[str] = None,
        limit: Annotated[int, Query(le=10000)] = 10000,
        uid: int = Depends(get_current_uid)
) -> OrderListResponse:
    logger.info("status:%d order_type:%s,uid:%d",status,order_type,uid)

    base_query = select(Order).where(Order.uid == uid)
    if status is not None and status != -1:
        base_query = base_query.where(Order.status == status)

    if order_type and order_type != "all":
        base_query = base_query.where(Order.order_type == order_type)

    # 获取总数
    count_query = select(sqlmodel.func.count()).select_from(base_query)
    total = session.exec(count_query).one()

    # 获取分页数据
    data_query = base_query.order_by(Order.created_at.desc()).offset(offset).limit(limit)
    orders = session.exec(data_query).all()

    # 判断是否有更多数据
    has_more = (offset + len(orders)) < total

    return OrderListResponse(
        total=total,
        orders=orders,
        has_more=has_more
    )

class OrderTicketsCreateRequest(BaseModel):
    order_id:int
    text: Optional[str] = None
    img: Optional[str] = None
    is_admin:bool

@router.post("/tickets/create")
def create_order_tickets(request: OrderTicketsCreateRequest, session: SessionDep,
                 uid: int = Depends(get_current_uid)) -> OrderTickets:
    logger.info("create_order_tickets:%s,uid:%s",request,uid)
    created_at = int(time.time())

    order = session.exec(
        select(Order).where(Order.id == request.order_id)
    ).first()

    if order is None:
        raise HTTPException(status_code=404, detail="order not found")

    tickets = OrderTickets(
        uid = order.uid,
        is_owner= True if request.is_admin is False else False,
        order_id=request.order_id,
        text=request.text,
        img=request.img,
        created_at = created_at,
    )

    existing_session = session.exec(
        select(OrderTicketsSession).where(OrderTicketsSession.order_id == request.order_id)
    ).first()

    session_text = request.text
    if request.img is not None and len(request.img) > 0:
        session_text = "[图片]"

    if existing_session:
        if request.is_admin is True:
            existing_session.is_reply = True
        else:
            existing_session.is_reply = False
        existing_session.text = session_text
        existing_session.updated_at = created_at
        session.add(existing_session)
    else:
        new_session = OrderTicketsSession(
            uid=order.uid,
            order_id=request.order_id,
            text=session_text,
            status=0,
            is_reply=False,
            updated_at=created_at
        )
        session.add(new_session)

    session.add(tickets)
    session.commit()
    session.refresh(tickets)
    return tickets


@router.get("/tickets/session/list")
def tickets_session_list(
        is_all: bool,
        session: SessionDep,
        uid: int = Depends(get_current_uid)) -> list[OrderTicketsSession]:
    check_admin(uid,session)
    if is_all is True:
        rows = session.exec(select(OrderTicketsSession).order_by(OrderTicketsSession.updated_at.desc())).all()
    else:
        rows = session.exec(select(OrderTicketsSession).where(OrderTicketsSession.is_reply == False).order_by(OrderTicketsSession.updated_at.desc())).all()
    return rows


class OrderTicketsListRes(BaseModel):
    rows:list[OrderTickets]
    order:Optional[Order] = None
    user:Optional[User] = None

@router.get("/tickets/list")
def tickets_list(
        order_id: str, is_admin:bool,session: SessionDep,
        uid: int = Depends(get_current_uid)) -> OrderTicketsListRes:
    logger.info("tickets_list:%s,uid:%s",order_id,uid)

    if is_admin is True:
        check_admin(uid,session)
        rows = session.exec(
            select(OrderTickets).where(OrderTickets.order_id == order_id).order_by(OrderTickets.created_at.desc())
        ).all()
    else:
        rows = session.exec(
            select(OrderTickets).where(OrderTickets.order_id == order_id).where(OrderTickets.uid == uid).order_by(OrderTickets.created_at.desc())
        ).all()
    order = session.exec(
        select(Order).where(Order.id == order_id)
    ).first()

    if order is None:
        raise HTTPException(status_code=404, detail="order not found")
    user = session.exec(
        select(User).where(User.id == order.uid)
    ).first()

    if user is None:
        raise HTTPException(status_code=404, detail="user not found")
    user.password = ""
    return OrderTicketsListRes(
        rows = rows,
        user = user,
        order=order,
    )

@router.get("/pay/qrcode/list")
def pay_qrcode_list(
        session: SessionDep,
        uid: int = Depends(get_current_uid)) -> list[PayQrcode]:
    check_admin(uid,session)
    rows = session.exec(
        select(PayQrcode).order_by(PayQrcode.created_at.desc())
    ).all()
    return rows


@router.get("/pay/qrcode/create")
def pay_qrcode_list(
        img:str,
        session: SessionDep,
        uid: int = Depends(get_current_uid)) -> PayQrcode:
    check_admin(uid,session)
    row = PayQrcode(
        img=img,
        created_at = int(time.time())
    )

    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.get("/pay/qrcode/active")
def pay_qrcode_active(
        aid: int,
        session: SessionDep,
        uid: int = Depends(get_current_uid)) -> PayQrcode:

    check_admin(uid,session)

    # 查找要激活的二维码
    row = session.exec(
        select(PayQrcode).where(PayQrcode.id == aid)
    ).first()

    if row is None:
        raise HTTPException(status_code=404, detail="Pay QR code not found")

    # 开始事务
    try:
        # 先将所有记录的 status 设置为 0
        all_qrcodes = session.exec(select(PayQrcode)).all()
        for qrcode in all_qrcodes:
            qrcode.status = 0
            session.add(qrcode)

        # 然后将选中的记录设置为 1
        row.status = 1
        session.add(row)

        # 提交事务
        session.commit()
        session.refresh(row)

        return row

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to activate QR code: {str(e)}")


@router.delete("/pay/qrcode/delete")
def pay_qrcode_delete(
        aid: int,
        session: SessionDep,
        uid: int = Depends(get_current_uid)) -> dict:

    check_admin(uid,session)
    # 查找要删除的二维码
    qrcode = session.exec(
        select(PayQrcode).where(PayQrcode.id == aid)
    ).first()

    if qrcode is None:
        raise HTTPException(status_code=404, detail="Pay QR code not found")

    try:
        # 删除记录
        session.delete(qrcode)
        session.commit()

        return {"message": "QR code deleted successfully", "deleted_id": id}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete QR code: {str(e)}")

class OrderStatusUpdate(BaseModel):
    amount:float
    status:Optional[int] = 0

class OrderStatusUpdateResponse(BaseModel):
    order:Order
    user:User

@router.post("/update/status/by/amount")
def update_status_by_amount(
        request:OrderStatusUpdate,
        session: SessionDep,
        uid: int = Depends(get_current_uid)
) -> OrderStatusUpdateResponse:

    check_admin(uid,session)

    logger.info("update_status_by_amount:%s",request)
    order = session.exec(
        select(Order).where(Order.amount_real == request.amount).where(Order.status == 0)
    ).first()
    if order is None:
        raise HTTPException(status_code=400, detail="order is null")
    order.status = request.status

    orderUser = session.exec(
        select(User).where(User.id == order.uid)
    ).first()
    logger.info("order:%s,user:%s",order,orderUser)

    current_time = int(time.time())
    vip_info = json.loads(order.order_info)
    logger.info("vip_info:%s",vip_info)
    pre_level = orderUser.level
    if order.order_type == "vip":
        add_time = 0
        if vip_info['type'] == 'svip':
            add_time = 99999 * 3600 * 24
            orderUser.level = 1
        if vip_info['type'] == 'year':
            add_time = 365 * 3600 * 24
            orderUser.level = 2
        if vip_info['type'] == 'month':
            add_time = 30 * 3600 * 24
            orderUser.level = 3

        current_vip_expired = orderUser.vip_expired_at

        if current_vip_expired < current_time:
            orderUser.vip_expired_at = current_time + add_time
        else:
            orderUser.vip_expired_at = current_vip_expired + add_time

        aa = AccountActivity(
            uid=order.uid,
            kind="vip",
            amount=orderUser.vip_expired_at,
            pre_amount=current_vip_expired,
            extra_info=f"pre_level:{pre_level},after_level:{orderUser.vip_expired_at}",
            info="VIP开通: "+vip_info['title'],
            created_at = current_time
        )
        session.add(aa)
        if orderUser.vip_first is True and "add_first" in vip_info.keys() and  vip_info['add_first'] > 0:
            aa = AccountActivity(
                uid=order.uid,
                kind="vip_first",
                amount=vip_info['add_first'],
                pre_amount=0,
                extra_info="order_no:"+order.order_no,
                info="VIP开通首充加赠: "+str(vip_info['add_first'])+" 元",
                created_at = current_time
            )
            session.add(aa)
            orderUser.balance = orderUser.balance + vip_info['add_first']
        orderUser.vip_first = False

    if order.order_type == "wallet":
        aa = AccountActivity(
            uid=order.uid,
            kind="wallet",
            amount=order.amount,
            pre_amount=orderUser.balance,
            extra_info="order_no:"+order.order_no,
            info="钱包充值: "+str(order.amount)+" 元",
            created_at = current_time
        )
        session.add(aa)

        if "vipGift" in vip_info.keys() and vip_info['vipGift'] > 0:
            vipGift = vip_info['vipGift']
            current_vip_expired = orderUser.vip_expired_at
            add_time = vipGift * 3600 * 24
            if current_vip_expired < current_time:
                orderUser.vip_expired_at = current_time + add_time
            else:
                orderUser.vip_expired_at = current_vip_expired + add_time

            aa = AccountActivity(
                uid=order.uid,
                kind="wallet_gift",
                amount=0,
                pre_amount=0,
                extra_info=f"order_no:{order.order_no}",
                info=f"钱充值赠送 {vip_info['vipGift']} 天VIP",
                created_at = current_time
            )
            session.add(aa)

        pre_balance = orderUser.balance
        if orderUser.wallet_first is True and "add_first" in vip_info.keys() and vip_info['add_first'] > 0:
            aa = AccountActivity(
                uid=order.uid,
                kind="wallet_first",
                amount=vip_info['add_first'],
                pre_amount=0,
                extra_info="order_no:"+order.order_no,
                info="钱包首充加赠: "+str(vip_info['add_first'])+" 元",
                created_at = current_time
            )
            session.add(aa)
            orderUser.balance = pre_balance +  order.amount + vip_info['add_first']
        else:
            orderUser.balance = pre_balance + order.amount

        orderUser.wallet_first = False


    inviteUser1 = session.exec(
        select(UserInvite).where(UserInvite.uid == order.uid)
    ).first()
    if inviteUser1 is not None:
        inviteUser = session.exec(
            select(User).where(User.id == inviteUser1.uid_by)
        ).first()
        if inviteUser is not None and inviteUser.level == 1:
            logger.info("inviteByUser:%s",inviteUser)
            amount = order.amount_real
            aa = AccountActivity(
                uid=inviteUser.id,
                kind="pay_reward",
                amount=amount,
                pre_amount=0,
                extra_info="order_no:"+order.order_no,
                info="订单支付返利: "+str(amount * 0.2)+" 元",
                created_at = current_time
            )
            session.add(aa)
            inviteUser.balance_withdraw = inviteUser.balance_withdraw + amount * 0.2
            session.add(inviteUser)
    session.add(orderUser)
    session.add(order)
    session.commit()
    session.refresh(order)
    session.refresh(orderUser)
    return OrderStatusUpdateResponse(
        order = order,
        user = orderUser
    )


@router.get("/by/amount")
def query_by_amount(
        amount:float,
        session: SessionDep,
        uid: int = Depends(get_current_uid)
) -> Order:
    check_admin(uid,session)
    logger.info("update_status_by_amount:%s",amount)
    order = session.exec(
        select(Order).where(Order.amount_real == amount)
    ).first()
    if order is None:
        raise HTTPException(status_code=400, detail="order is null")
    return order

