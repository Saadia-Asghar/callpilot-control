"""
Authentication and authorization module for multi-operator support.
"""
from datetime import datetime, timedelta
from typing import Optional
try:
    from jose import JWTError, jwt
except ImportError:
    # Fallback for python-jose
    try:
        from jose.jwt import JWTError, jwt
    except ImportError:
        raise ImportError("python-jose[cryptography] is required. Install with: pip install python-jose[cryptography]")
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
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

# HTTP Bearer token
security = HTTPBearer()


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


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


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


def get_current_operator(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Operator:
    """
    Get the current authenticated operator from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials
        db: Database session
    
    Returns:
        Operator object
    
    Raises:
        HTTPException: If token is invalid or operator not found
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
    Useful for endpoints that work with or without authentication.
    """
    if not credentials:
        return None
    
    try:
        return get_current_operator(credentials, db)
    except HTTPException:
        return None
