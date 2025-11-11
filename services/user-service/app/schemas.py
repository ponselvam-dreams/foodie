from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


class UserRole(Enum):
    VIEWER = "viewer"
    ADMIN = "admin"


class UserBase(BaseModel):
    id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    phone_number: Optional[str] = None
    role: UserRole = UserRole.VIEWER
    is_active: bool = True
    is_admin: bool = False
    created_at: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None


class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True


class UserVerify(BaseModel):
    email: EmailStr
    password: str


class UserProfileBase(BaseModel):
    nickname: Optional[str] = None
    username: Optional[str] = None
    date_of_birth: Optional[str] = None
    alt_phone_number: Optional[str] = None
    alt_email: Optional[EmailStr] = None
    addresses: Optional[str] = None
    photo: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    user_id: int


class UserProfileOut(UserProfileBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
