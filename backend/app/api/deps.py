"""
API dependencies
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import structlog

from app.config import get_settings
from app.database import get_db
from app.models import User

logger = structlog.get_logger(__name__)
settings = get_settings()

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"leeway": 10}  # 10 seconds clock skew tolerance
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        logger.warning("JWT validation failed", exc_info=e)
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify current user has admin or super_admin role
    """
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def rate_limit_check(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check rate limits for user
    TODO: Implement actual rate limiting logic
    """
    pass  # Placeholder for rate limiting