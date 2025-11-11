from sqlalchemy import Column, Integer, String, DateTime, func, Boolean, Enum as SQLAlchemyEnum
from app.db.database import Base
from app.schemas import UserRole
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True)
    phone_number = Column(String, unique=True)
    password = Column(String)
    role = Column(SQLAlchemyEnum(UserRole), default=UserRole.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    profile = relationship("UserProfile", back_populates="user", cascade="all, delete", uselist=False)
