from pydantic import BaseModel, EmailStr
from typing import Optional


class EmailSchema(BaseModel):
    email: EmailStr

class OTPVerificationSchema(BaseModel):
    email: EmailStr
    otp: str

class UserTokenData(BaseModel):
    email: EmailStr
    message: str
    access_token: str
    refresh_token: str
    token_type: str

class RefreshTokenSchema(BaseModel):
    refresh_token: str
