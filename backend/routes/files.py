import mimetypes
import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi import File as FormFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, MAX_FILE_SIZE_MB
from database import get_db
from models import File, User
from schemas import FileListResponse, FileOut, SharedFileInfo, ShareResponse
from storage import FileTooLarge, make_stored_name, sanitize_filename, storage

router = APIRouter(tags=["Files"])


def get_owned_file(file_id: int, user: User, db: Session) -> File:
    """Fetch a file and make sure it belongs to the current user.
    Returns 404 (not 403) for other users' files so IDs can't be probed."""
    record = db.get(File, file_id)
    if record is None or record.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    return record


def stream_file(record: File) -> StreamingResponse:
    if not storage.exists(record.stored_filename):
        raise HTTPException(status.HTTP_410_GONE, "The file record exists but its data is missing from storage")
    # filename* handles non-ASCII names safely
    from urllib.parse import quote
    disposition = f"attachment; filename*=UTF-8''{quote(record.original_filename)}"
    return StreamingResponse(
        storage.open(record.stored_filename),
        media_type=record.file_type or "application/octet-stream",
        headers={
            "Content-Disposition": disposition,
            "Content-Length": str(record.file_size),
        },
    )


@router.post("/files/upload", response_model=FileOut, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = FormFile(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    original = sanitize_filename(file.filename or "")
    if not original:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or missing filename")

    ext = os.path.splitext(original)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"File type '{ext or 'no extension'}' is not supported",
        )

    stored = make_stored_name(original)
    try:
        size = storage.save(stored, file.file, MAX_FILE_SIZE)
    except FileTooLarge:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File is larger than the {MAX_FILE_SIZE_MB} MB limit"
        )

    if size == 0:
        storage.delete(stored)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The file is empty")

    file_type = mimetypes.guess_type(original)[0] or file.content_type or "application/octet-stream"
    record = File(
        user_id=user.id,
        original_filename=original,
        stored_filename=stored,
        file_size=size,
        file_type=file_type,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/files", response_model=FileListResponse)
def list_files(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    files = db.query(File).filter(File.user_id == user.id).order_by(File.upload_date.desc()).all()
    total_size = db.query(func.coalesce(func.sum(File.file_size), 0)).filter(File.user_id == user.id).scalar()
    return FileListResponse(files=files, total_files=len(files), total_size=total_size)


@router.get("/files/{file_id}/download")
def download_file(file_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return stream_file(get_owned_file(file_id, user, db))


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(file_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = get_owned_file(file_id, user, db)
    storage.delete(record.stored_filename)
    db.delete(record)
    db.commit()


@router.post("/files/{file_id}/share", response_model=ShareResponse)
def share_file(file_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = get_owned_file(file_id, user, db)
    if not record.share_token:
        record.share_token = secrets.token_urlsafe(16)  # ~128 bits, unguessable
        db.commit()
    return ShareResponse(share_token=record.share_token)


@router.delete("/files/{file_id}/share", status_code=status.HTTP_204_NO_CONTENT)
def unshare_file(file_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = get_owned_file(file_id, user, db)
    record.share_token = None
    db.commit()


def get_shared(share_token: str, db: Session) -> File:
    record = db.query(File).filter(File.share_token == share_token).first()
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This share link is invalid or has been revoked")
    return record


@router.get("/share/{share_token}")
def download_shared(share_token: str, db: Session = Depends(get_db)):
    """Public: anyone with the link can download. No login required."""
    return stream_file(get_shared(share_token, db))


@router.get("/share/{share_token}/info", response_model=SharedFileInfo)
def shared_info(share_token: str, db: Session = Depends(get_db)):
    record = get_shared(share_token, db)
    return SharedFileInfo(
        original_filename=record.original_filename,
        file_size=record.file_size,
        file_type=record.file_type,
        upload_date=record.upload_date,
        shared_by=record.owner.username,
    )
