import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.services.auth import create_access_token, verify_otp

router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    phone: str
    otp: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    if not verify_otp(req.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            phone=req.phone,
            display_name=req.phone.replace("+", ""),
            is_online=True,
            last_seen=datetime.datetime.utcnow(),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.is_online = True
        user.last_seen = datetime.datetime.utcnow()
        await db.commit()

    token = create_access_token({"sub": str(user.id)})

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
