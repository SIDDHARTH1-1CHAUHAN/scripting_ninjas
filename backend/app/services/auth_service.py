from datetime import datetime, timedelta, timezone
import os

import httpx
from jose import JWTError, jwt


class AuthService:
    """Google OAuth token verification + app JWT issuance."""

    def __init__(self) -> None:
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
        self.jwt_secret = os.getenv("JWT_SECRET", "change-me-in-production")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_expire_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

    async def verify_google_id_token(self, id_token: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
                timeout=10.0,
            )
            response.raise_for_status()
            token_data = response.json()

        audience = str(token_data.get("aud", "")).strip()
        if self.google_client_id and audience != self.google_client_id:
            raise ValueError("Google token audience mismatch")

        issuer = str(token_data.get("iss", ""))
        if issuer not in {"accounts.google.com", "https://accounts.google.com"}:
            raise ValueError("Invalid Google token issuer")

        email = str(token_data.get("email", "")).strip()
        if not email:
            raise ValueError("Google token missing email")

        return {
            "id": str(token_data.get("sub", "")).strip() or email,
            "email": email,
            "name": str(token_data.get("name", "")).strip() or email.split("@")[0],
            "picture": str(token_data.get("picture", "")).strip(),
            "email_verified": str(token_data.get("email_verified", "false")).lower() == "true",
        }

    def create_access_token(self, user: dict) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user.get("id"),
            "email": user.get("email"),
            "name": user.get("name"),
            "picture": user.get("picture"),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=self.jwt_expire_minutes)).timestamp()),
        }
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)

    def decode_access_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "picture": payload.get("picture"),
            }
        except JWTError as exc:
            raise ValueError("Invalid access token") from exc


auth_service = AuthService()

