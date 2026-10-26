"""
Authentication service
"""

from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import jwt
import structlog

from app.config import get_settings
from app.models import User

logger = structlog.get_logger(__name__)
settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """
    Authentication and authorization service
    """
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate password hash"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create JWT access token
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm
        )
        
        return encoded_jwt
    
    @staticmethod
    def authenticate_user(db, email: str, password: str) -> Optional[User]:
        """
        Authenticate user by email and password
        """
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            logger.warning("Authentication failed: user not found", email=email)
            return None
        
        if not user.is_active:
            logger.warning("Authentication failed: user inactive", email=email)
            return None
        
        if not AuthService.verify_password(password, user.password_hash):
            logger.warning("Authentication failed: invalid password", email=email)
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        logger.info("User authenticated successfully", user_id=str(user.id), email=email)
        return user