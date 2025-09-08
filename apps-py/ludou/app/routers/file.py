import logging
import ffmpeg
from fastapi import UploadFile, APIRouter, HTTPException, Depends
from typing import Optional

from fastapi.params import Query

from ..config import ASSETS_DIR
from ..utils import get_file_size, create_dir
from  ..dependencies import get_bearer_token_header

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/file",
    dependencies=[Depends(get_bearer_token_header)],
    tags=["file"],
    responses={404: {"description": "Not found"}},
)

@router.post("/upload")
async def upload_file(file: UploadFile,path: Optional[str] = Query(None)):
    logger.info("upload_file: %s,path:%s",file,path)
    file2store = await file.read()

    if path is not None:
        if "../" in path:
            raise HTTPException(status_code=400, detail="Invalid file path")
        file_path = f"{ASSETS_DIR}/{path}"
    else:
        if "../" in file.filename:
            raise HTTPException(status_code=400, detail="Invalid file path")
        file_path = f"{ASSETS_DIR}/static/{file.filename}"
    logger.info("file_path: %s",file_path)
    create_dir(file_path)
    with open(file_path, "wb") as f:
        f.write(file2store)
        if path is not None and path.startswith("video"):
            preview_path = file_path.replace("/video/","/preview/")
            logger.info("ffmpeg gen 3s video: %s",preview_path)
            try:
                ffmpeg.input(file_path).output(
                    preview_path,
                    t=3,           # Duration of 3 seconds
                    f='mp4',       # Format
                    c='copy'       # Copy codec
                ).overwrite_output().run(
                    quiet=True     # Suppress output unless there's an error
                )
                logger.info("Successfully generated preview: %s", preview_path)

            except ffmpeg.Error as e:
                logger.error("ffmpeg failed with error: %s", e.stderr.decode() if e.stderr else str(e))
            except Exception as e:
                logger.error("Error executing ffmpeg: %s", str(e))
    return {"filename": file.filename,"size":get_file_size(file_path)}