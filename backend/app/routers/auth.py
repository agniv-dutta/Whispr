import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.database import get_db
from app.models import User
from app.schemas import RegisterRequest, LoginRequest, AuthResponse
from app.services.auth import create_access_token, verify_otp

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()


def _build_auth_response(user: User) -> AuthResponse:
    token = create_access_token(data={"sub": user.id})
    return AuthResponse(access_token=token, user=user)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if not verify_otp(payload.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    existing = await db.execute(select(User).where(User.phone == payload.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Phone already registered")

    user = User(
        phone=payload.phone,
        display_name=payload.display_name,
        hashed_password=pwd_context.hash(payload.phone),
        is_online=True,
        last_seen=datetime.datetime.utcnow(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _build_auth_response(user)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    if not verify_otp(payload.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    result = await db.execute(select(User).where(User.phone == payload.phone))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_online = True
    user.last_seen = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    return _build_auth_response(user)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    return {"message": "Logged out"}
