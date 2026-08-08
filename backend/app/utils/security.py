from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import hashlib

try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False

from app.config import settings
from app.database.database import get_db
from app.models.user import User

security = HTTPBearer()

def hash_password(password: str) -> str:
    # Bcrypt has 72 bytes limit - truncate if needed (common practice)
    # Use SHA256 pre-hash for longer passwords to avoid truncation issues
    if len(password.encode('utf-8')) > 72:
        # Pre-hash with SHA256 then base64 encode to keep within limit
        password = hashlib.sha256(password.encode('utf-8')).hexdigest()

    if HAS_BCRYPT:
        # Use bcrypt directly to avoid passlib compatibility issues with bcrypt 4.x
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        return hashed.decode('utf-8')
    else:
        # Fallback to simple SHA256 (NOT secure for production, but works for demo if bcrypt missing)
        # In production bcrypt should be installed
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()

    if HAS_BCRYPT:
        try:
            # Check if stored hash is bcrypt format
            if hashed_password.startswith("$2"):
                password_bytes = plain_password.encode('utf-8')
                if len(password_bytes) > 72:
                    password_bytes = password_bytes[:72]
                return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
            else:
                # Fallback: compare SHA256
                return hashlib.sha256(plain_password.encode('utf-8')).hexdigest() == hashed_password
        except Exception as e:
            print(f"Bcrypt verify failed: {e}")
            return False
    else:
        return hashlib.sha256(plain_password.encode('utf-8')).hexdigest() == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_user_initials(full_name: str) -> str:
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    elif len(parts) == 1 and len(parts[0]) >= 2:
        return parts[0][:2].upper()
    else:
        return "U"
