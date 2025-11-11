from sqlalchemy import Column, Integer, String, DateTime, func, Text
from app.db.database import Base


# Auth service no longer owns the full user table. It stores refresh tokens
# referencing the canonical user id as a string (no FK to external DB).
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(512), unique=True, index=True, nullable=False)
    user_id = Column(String(128), index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    device_info = Column(Text, nullable=True)
