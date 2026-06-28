import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from passlib.context import CryptContext

from app.database import get_db
from app.models import User
from app.services.auth import create_access_token, verify_otp

_pwd_context = None
_PLACEHOLDER_HASH = None

def _get_placeholder_hash() -> str:
    global _pwd_context, _PLACEHOLDER_HASH
    if _PLACEHOLDER_HASH is None:
        if _pwd_context is None:
            _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        _PLACEHOLDER_HASH = _pwd_context.hash("whispr-placeholder")
    return _PLACEHOLDER_HASH

logger = logging.getLogger("whispr.auth")
router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    phone: str
    otp: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.get("/test")
async def test():
    """Public debug endpoint — returns OK if backend is alive."""
    return {"status": "OK", "message": "Auth router is running"}


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    logger.info("Login attempt — phone=%s otp=%s", req.phone, req.otp)

    if not verify_otp(req.otp):
        logger.warning("Invalid OTP for %s", req.phone)
        raise HTTPException(status_code=400, detail="Invalid OTP")

    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalar_one_or_none()

    if not user:
        logger.info("Creating new user for %s", req.phone)
        user = User(
            phone=req.phone,
            display_name=req.phone.replace("+", ""),
            hashed_password=_get_placeholder_hash(),
            is_online=True,
            last_seen=datetime.datetime.utcnow(),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        logger.info("Found existing user %s (%s)", user.display_name, user.id)
        user.is_online = True
        user.last_seen = datetime.datetime.utcnow()
        await db.commit()

    token = create_access_token({"sub": str(user.id)})
    logger.info("Login success — token=%s…", token[:20])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "phone": user.phone,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
        },
    }


@router.post("/register", response_model=LoginResponse)
async def register(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login(req, db)
