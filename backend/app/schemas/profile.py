from pydantic import BaseModel
from typing import Optional


class UserProfileBase(BaseModel):
    nickname: Optional[str] = None
    username: Optional[str] = None
    date_of_birth: Optional[str] = None
    alt_phone_number: Optional[str] = None
    alt_email: Optional[str] = None
    addresses: Optional[str] = None
    photo: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    user_id: Optional[int] = None

class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    username: Optional[str] = None
    date_of_birth: Optional[str] = None
    alt_phone_number: Optional[str] = None
    alt_email: Optional[str] = None
    addresses: Optional[str] = None
    photo: Optional[str] = None

class UserProfileInDb(UserProfileBase):
    id: Optional[int] = None
    user_id: Optional[int] = None

    class Config:
        from_attributes = True
