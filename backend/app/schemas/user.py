from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

# class UserCreate(BaseModel):
#     email: EmailStr
#     password: str
#     full_name: Optional[str] = None

# class UserOut(BaseModel):
#     id: int
#     email: EmailStr
#     full_name: Optional[str] = None

#     class Config:
#         orm_mode = True

# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str



############################################


class UserRole(Enum):
    VIEWER = "viewer"
    ADMIN = "admin"
    # BLOG_MANAGER = "blog_manager"
    # NEWS_MANAGER = "news_manager"
    # CONTENT_MANAGER = "content_manager"
    # SPEC_MANAGER = "spec_manager"
    # ANALYTICS_MANAGER = "analytics_manager"


class UserBase(BaseModel):
    id: Optional[int] = None
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    role: UserRole 
    is_active: bool = True
    is_admin: bool = False
    created_at: Optional[str] = None


class UserCreate(UserBase):
    email: EmailStr
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: UserRole = UserRole.VIEWER


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False


class UserInDB(UserBase):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: UserRole
    phone_number: Optional[str]
    # profile: Optional[UserProfileInDb]
    class Config:
        from_attributes = True

