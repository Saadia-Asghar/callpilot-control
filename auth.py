"""
Authentication and authorization module for multi-operator support.
Includes password reset with secure token-based flow.
"""
from datetime import datetime, timedelta
from typing import Optional
import secrets
import hashlib

try:
    from jose import JWTError, jwt
except ImportError:
    try:
        from jose.jwt import JWTError, jwt
    except ImportError:
        raise ImportError("python-jose[cryptography] is required. Install with: pip install python-jose[cryptography]")

from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models import Operator
from config import settings
from logging_config import get_logger

logger = get_logger("auth")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = settings.openai_api_key[:32] if settings.openai_api_key else "callpilot-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Password reset settings
RESET_TOKEN_EXPIRE_MINUTES = 15

# HTTP Bearer token
security = HTTPBearer()


# ── Pydantic Models ──────────────────────────────────────────────────────────

class Token(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data model."""
    operator_id: Optional[int] = None
    email: Optional[str] = None


class OperatorCreate(BaseModel):
    """Operator creation model."""
    email: EmailStr
    password: str
    name: Optional[str] = None
    business_name: Optional[str] = None


class OperatorLogin(BaseModel):
    """Operator login model."""
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request model."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request model."""
    token: str
    new_password: str


# ── Password Helpers ─────────────────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def validate_password_strength(password: str) -> Optional[str]:
    """
    Validate password strength. Returns error message or None.
    """
    if len(password) < 6:
        return "Password must be at least 6 characters"
    if len(password) > 128:
        return "Password must be at most 128 characters"
    return None


# ── Reset Token Helpers ──────────────────────────────────────────────────────

def generate_reset_token() -> str:
    """Generate a secure random 32-byte hex token."""
    return secrets.token_hex(32)


def hash_token(token: str) -> str:
    """Hash a token using SHA-256 for secure DB storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ── JWT Helpers ──────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ── Auth Dependencies ────────────────────────────────────────────────────────

def get_current_operator(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Operator:
    """
    Get the current authenticated operator from JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        operator_id: int = payload.get("sub")
        if operator_id is None:
            raise credentials_exception
        token_data = TokenData(operator_id=operator_id)
    except JWTError:
        raise credentials_exception
    
    operator = db.query(Operator).filter(Operator.id == token_data.operator_id).first()
    if operator is None:
        raise credentials_exception
    
    if not operator.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator account is inactive"
        )
    
    return operator


def get_optional_operator(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[Operator]:
    """
    Get the current operator if authenticated, otherwise return None.
    """
    if not credentials:
        return None
    
    try:
        return get_current_operator(credentials, db)
    except HTTPException:
        return None


# ── Rate Limiter (in-memory, simple) ─────────────────────────────────────────

_rate_limit_store: dict[str, list[float]] = {}
RATE_LIMIT_MAX = 5         # max requests
RATE_LIMIT_WINDOW = 3600   # per hour (seconds)


def check_rate_limit(key: str) -> bool:
    """
    Returns True if under rate limit, False if exceeded.
    Simple in-memory sliding window.
    """
    now = datetime.utcnow().timestamp()
    window_start = now - RATE_LIMIT_WINDOW
    
    if key not in _rate_limit_store:
        _rate_limit_store[key] = []
    
    # Remove expired entries
    _rate_limit_store[key] = [t for t in _rate_limit_store[key] if t > window_start]
    
    if len(_rate_limit_store[key]) >= RATE_LIMIT_MAX:
        return False
    
    _rate_limit_store[key].append(now)
    return True


def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── Mock Email Service (Hackathon Mode) ──────────────────────────────────────

def send_reset_email(email: str, reset_link: str):
    """
    Send password reset email.
    In HACKATHON_MODE, logs to console instead of sending real email.
    """
    if settings.hackathon_mode:
        logger.info("=" * 60)
        logger.info("  PASSWORD RESET LINK (HACKATHON MODE)")
        logger.info(f"  Email: {email}")
        logger.info(f"  Link:  {reset_link}")
        logger.info("=" * 60)
        print("\n" + "=" * 60)
        print("  PASSWORD RESET LINK (HACKATHON MODE)")
        print(f"  Email: {email}")
        print(f"  Link:  {reset_link}")
        print("=" * 60 + "\n")
    else:
        # Production: integrate with email service (SendGrid, SES, etc.)
        logger.info(f"Reset email sent to {email}")
        # TODO: integrate real email service
