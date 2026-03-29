from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class AuthRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str


class StudentRegisterRequest(BaseModel):
    """Student registration with optional MTUCI LK integration"""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = ""
    mtuci_login: str | None = None
    mtuci_password: str | None = None


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class MTUCIAuthData(BaseModel):
    """MTUCI LK credentials for auto-fill"""
    mtuci_login: str
    mtuci_password: str

