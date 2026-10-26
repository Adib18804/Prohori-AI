"""
Request context middleware
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import uuid
import structlog


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add request context and logging
    """
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Bind to structured logging context
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            path=request.url.path,
            method=request.method,
        )
        
        # Process request
        response = await call_next(request)
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        # Clear context
        structlog.contextvars.clear_contextvars()
        
        return response