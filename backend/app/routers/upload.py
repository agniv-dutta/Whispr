import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from starlette.responses import JSONResponse

router = APIRouter()

UPLOAD_DIR = "static/uploads"
MAX_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain", "text/csv",
    "application/zip", "application/x-rar-compressed",
}


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.content_type or file.content_type not in ALLOWED_TYPES:
        if not _is_image_by_ext(file.filename or ""):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File type not allowed",
            )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large (max 10MB)",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = ""
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[1]
    safe_name = f"{uuid.uuid4().hex}_{uuid.uuid4().hex[:8]}"
    if ext:
        safe_name = f"{safe_name}.{ext}"

    filepath = os.path.join(UPLOAD_DIR, safe_name)
    with open(filepath, "wb") as f:
        f.write(content)

    url = f"/static/uploads/{safe_name}"
    file_type = file.content_type or "application/octet-stream"
    file_size = len(content)
    file_name = file.filename or safe_name

    return {
        "url": url,
        "file_type": file_type,
        "file_size": file_size,
        "file_name": file_name,
    }


def _is_image_by_ext(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in {"jpg", "jpeg", "png", "gif", "webp"}
