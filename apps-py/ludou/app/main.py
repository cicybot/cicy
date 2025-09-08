import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import AsyncIterator
from typing import Optional

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlmodel import select

from .config import SECRET_KEY, ALGORITHM, VIPS, WALLET_DEPOSIT_ITEMS, INVITE_LINK, INVITE_MESSAGE, \
    ACCESS_TOKEN_EXPIRE_MINUTES
from .db import create_db_and_tables, SessionDep
from .model.Models import User
from .routers import auth, file, video, order, user

os.environ['TZ'] = 'UTC'

log_dir = os.getenv("LOG_DIR","")
log_file=f"{log_dir}/app.log"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file)
    ]
)
logger = logging.getLogger(__name__)
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    create_db_and_tables()
    yield

logger.info("init!")

app = FastAPI(lifespan=lifespan)
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3081","http://localhost:3173","http://localhost:4173",
                   "http://119.29.236.138",
                   "http://192.168.233.244:3081"],  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(order.router)
app.include_router(user.router)
app.include_router(file.router)
app.include_router(video.router)
app.include_router(auth.router)

@app.get("/swagger",response_class=HTMLResponse, include_in_schema=False)
async def swagger():
    return  f"""<!DOCTYPE html>
<html>
<head>
<link type="text/css" rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/swagger-ui/5.27.1/swagger-ui.css">
<link rel="shortcut icon" href="https://fastapi.tiangolo.com/img/favicon.png">
<title>FastAPI - Swagger UI</title>
</head>
<body>
<div id="swagger-ui">
</div>
<script src="https://cdn.bootcdn.net/ajax/libs/swagger-ui/5.27.1/swagger-ui-bundle.js"></script>
<script>
    const ui = SwaggerUIBundle({{
    url: '/openapi.json',
    "dom_id": "#swagger-ui",
"layout": "BaseLayout",
"deepLinking": true,
"showExtensions": true,
"showCommonExtensions": true,
oauth2RedirectUrl: window.location.origin + '/docs/oauth2-redirect',
    presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
    }})
</script>
</body>
</html>
"""

class ServiceSettings(BaseModel):
    name: str
    url: str

class AppSettingsResponse(BaseModel):
    user: Optional[User] = None
    app_download_url: Optional[str] = None
    service:Optional[ServiceSettings] = None
    token_expires:str
    token_expires_date:int
    token: Optional[str] = None
    token_video: Optional[str] = None
    token_video_expires_date:int
    token_video_expires:str
    invite_link:str
    invite_message:str
    vips: str
    ts:int
    ts_date:str
    wallet_deposit_items: str


class AppSettingRequest(BaseModel):
    token_video: Optional[str] = None


@app.post("/api/app/settings",response_model=AppSettingsResponse)
async def appSettings(session: SessionDep,request: AppSettingRequest,credentials: HTTPAuthorizationCredentials = Depends(auth.security)):
    token_video = request.token_video
    token_video_expires_date = 0
    token_video_expires = ""

    user1= None
    token_expires_date = 0
    token_expires = ""
    token = None
    ts = datetime.utcnow().timestamp()
    if credentials:
        token = credentials.credentials
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            logger.info("payload:%s",payload)
            statement = select(User).where(User.username == payload.get("sub"))
            result = session.exec(statement)
            user = result.first()
            user.password = ""
            user1 = user
            token_expires = datetime.fromtimestamp(payload.get("exp")).isoformat()
            token_expires_date = payload.get("exp")
            if ts < token_expires_date - 3600 * 24 and ts < token_expires_date:
                token_data = {
                    "sub": user.username,
                    "uid": user.id,
                }
                timedelta_auth = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES * 2 * 24 * 7)
                token,token_expires_date_time = auth.create_access_token(token_data,timedelta_auth)

                token_expires_date = int(token_expires_date_time.timestamp())
                token_expires = datetime.fromtimestamp(token_expires_date).isoformat()
            if token_video:
                try:
                    payload_req_video = jwt.decode(token_video, SECRET_KEY, algorithms=[ALGORITHM])
                    logger.info(payload_req_video)
                    token_video_expires_date = payload_req_video['exp']
                    token_video_expires = datetime.fromtimestamp(payload_req_video['exp']).isoformat()
                except JWTError as e:
                    token_video = None
            if token_video is None:
                user.vip_expired_at = ts + 3600 * 24
                if user.vip_expired_at > 0 and user.vip_expired_at > ts:
                    token_data_video = {
                        "uid": user.id,
                    }
                    timedelta_video = timedelta(minutes=(user.vip_expired_at - ts )/60)
                    token_video,token_video_expires_date_time = auth.create_access_token(token_data_video,timedelta_video)
                    token_video_expires_date = int(token_video_expires_date_time.timestamp())
                    token_video_expires = datetime.fromtimestamp(token_video_expires_date).isoformat()

            if ts >= token_expires_date:
                token = None
                token_video=None
                user1 = None

        except JWTError as e:
            token = None
            token_video = None
    else:
        token = None
        token_video = None

    return AppSettingsResponse(
        vips=VIPS,
        token=token,
        token_expires_date=token_expires_date,
        token_expires=token_expires,
        token_video=token_video,
        token_video_expires_date = token_video_expires_date,
        token_video_expires = token_video_expires,
        invite_link=INVITE_LINK,
        invite_message=INVITE_MESSAGE,
        wallet_deposit_items=WALLET_DEPOSIT_ITEMS,
        # app_download_url='https://hhlw.qpe6ow.xyz',
        # service=ServiceSettings(
        #     name="https://dym188.org/lvdou",
        #     url="三人行必有老司机",
        # ),
        user=user1,
        ts_date = str( datetime.fromtimestamp(ts).isoformat()),
        ts = int(ts),
    )


@app.get("/api")
async def root():
    logger.info("root")
    return {"message": "Hello Bigger Applications!","version":"1.0.1"}
