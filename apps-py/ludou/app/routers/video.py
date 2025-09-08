import logging
import time
from typing import Annotated

from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from ..utils import create_dir,get_file_size
from ..config import ASSETS_DIR
from ..db import SessionDep
from ..model.Models import Video
from  ..dependencies import get_bearer_token_header

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/video",
    tags=["video"],
    dependencies=[Depends(get_bearer_token_header)],
    responses={404: {"description": "Not found"}},
)

def get_file_info(video:Video):
    path = video.path
    thumb = f"thumb/{path}.jpeg"
    preview = f"preview/{path}"
    video = f"video/{path}"
    thumb_size = get_file_size(f"{ASSETS_DIR}/{thumb}")
    preview_size = get_file_size(f"{ASSETS_DIR}/{preview}")
    video_size = get_file_size(f"{ASSETS_DIR}/{video}")

    return VideoFileInfo(
        thumb=thumb,
        preview=preview,
        video=video,
        thumb_size=thumb_size,
        preview_size=preview_size,
        video_size=video_size
    )

def init_assets_dir(video:Video):
    info = get_file_info(video)
    create_dir(f"{ASSETS_DIR}/{info.thumb}")
    create_dir(f"{ASSETS_DIR}/{info.preview}")
    create_dir(f"{ASSETS_DIR}/{info.video}")
    return get_file_info(video)

class VideoFileInfo(BaseModel):
    video:str
    video_size:int
    preview:str
    preview_size:int
    thumb:str
    thumb_size:int

class VideoResponse(BaseModel):
    video:Video
    file_info:VideoFileInfo


@router.post("/save")
def save_video(video: Video, session: SessionDep) -> VideoResponse :
    try:
        logger.info("save_video:%s",video)
        if video.created_at is None:
            video.created_at = int(time.time())
        if not video.content:
            raise HTTPException(status_code=400, detail="Content is required")
        if not video.id_key:
            raise HTTPException(status_code=400, detail="id_key is required")

        if not video.path:
            raise HTTPException(status_code=400, detail="Path is required")

        statement = select(Video).where(Video.id_key == video.id_key)
        result = session.exec(statement)
        existing_video = result.first()
        logger.info("existing_video: %s",existing_video)

        if existing_video is None:
            video.id = None  # Ensure new ID is generated

            session.add(video)
            session.commit()
            session.refresh(video)
        else:
            update_data = video.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(existing_video, key, value)

            session.add(existing_video)
            session.commit()
            session.refresh(existing_video)
            video = existing_video

        return VideoResponse(
            video=video,
            file_info=init_assets_dir(video)
        )
    except IntegrityError as e:
        logger.error("IntegrityError:%s",e)
        session.rollback()
        # Handle database-level unique constraint violation
        if "unique constraint" in str(e).lower() and "id_key" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail=f"Video with id_key '{video.id_key}' already exists"
            )
        raise HTTPException(status_code=500, detail="Database error")

    except Exception as e:
        logger.error("Exception:%s",e)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/list")
def read_videos(
        session: SessionDep,
        offset: int = 0,
        limit: Annotated[int, Query(le=100)] = 100,
) -> list[Video]:
    rows = session.exec(
        select(Video).order_by(Video.created_at.desc()).offset(offset).limit(limit)
    ).all()
    return rows


@router.get("/detail/{id}")
def read_video(id: int, session: SessionDep) -> VideoResponse:
    video = session.get(Video, id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return VideoResponse(
        video=video,
        file_info=init_assets_dir(video)
    )


@router.get("/key/{id_key}")
def read_video_by_key(id_key: str, session: SessionDep) -> VideoResponse:
    statement = select(Video).where(Video.id_key == id_key)
    result = session.exec(statement)
    video = result.first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return VideoResponse(
        video=video,
        file_info=get_file_info(video)
    )

@router.delete("/{id}")
def delete_video(id: int, session: SessionDep):
    video = session.get(Video, id)
    if not video:
        raise HTTPException(status_code=404, detail="video not found")
    session.delete(video)
    session.commit()
    return {"ok": True}