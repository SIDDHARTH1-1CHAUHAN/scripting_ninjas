from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ...services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


class GoogleAuthRequest(BaseModel):
    id_token: str


class DemoAuthRequest(BaseModel):
    name: str = "Demo Import Manager"
    email: str = "demo@tradeoptimize.local"


@router.post("/google")
async def google_login(request: GoogleAuthRequest):
    try:
        user = await auth_service.verify_google_id_token(request.id_token)
        access_token = auth_service.create_access_token(user)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
        }
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Google auth failed: {exc}") from exc


@router.post("/demo")
async def demo_login(request: DemoAuthRequest):
    user = {
        "id": "demo-user",
        "email": request.email.strip().lower(),
        "name": request.name.strip() or "Demo Import Manager",
        "picture": "",
        "email_verified": True,
    }
    access_token = auth_service.create_access_token(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me")
async def me(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    try:
        user = auth_service.decode_access_token(token)
        return {"user": user}
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc
