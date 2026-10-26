"""
Prohori AI - Multi-Agent Explainable AI Security Gateway
Main FastAPI application
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import uuid
import structlog

from app.config import get_settings
from app.middleware.request_context import RequestContextMiddleware
from app.api import auth, protect, transcripts, ops, admin, plans, billing, chat, analytics

# Initialize structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Prohori AI Security Gateway",
    description="Multi-agent explainable AI security layer for LLM applications",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestContextMiddleware)

if settings.environment == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*.prohori.ai", "localhost", "127.0.0.1"]
    )

# Add routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(protect.router, prefix="/api/v1", tags=["security"])
app.include_router(transcripts.router, prefix="/api/v1", tags=["transcripts"])
app.include_router(analytics.router, prefix="/api/v1", tags=["analytics"])
app.include_router(ops.router, prefix="/api/v1", tags=["operations"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(plans.router, prefix="/api/v1/plans", tags=["plans"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["billing"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])

@app.on_event("startup")
def _startup():
    from app.database.session import init_db
    init_db()

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    # Add request ID to logs
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)
    
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-ID"] = request_id
    
    logger.info(
        "Request processed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time=process_time,
    )
    
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception",
        exc_info=exc,
        path=request.url.path,
        method=request.method,
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "request_id": getattr(request.state, 'request_id', None)
        }
    )

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Prohori AI Security Gateway",
        "version": "1.0.0",
        "status": "operational",
        "tagline": "Every Prompt Defended. Every Verdict Explained."
    }

@app.get("/api/v1/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": settings.environment,
        "database": "connected",  # TODO: Add actual DB health check
        "ai_services": "available"  # TODO: Add actual AI service check
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_config=None,  # Use structlog instead
    )