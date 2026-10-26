"""
Operations and health check endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
import structlog

from app.database import get_db
from app.config import get_settings
from app.api.deps import get_current_admin
from app.ml.classifier import get_classifier

logger = structlog.get_logger(__name__)
router = APIRouter()
settings = get_settings()


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    ai_services: str


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check
    """
    # Check database connection
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        logger.error("Database health check failed", exc_info=e)
        db_status = "disconnected"
    
    # Check AI services
    ai_status = "available"  # TODO: Add actual AI service health check
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "version": "1.0.0",
        "environment": settings.environment,
        "database": db_status,
        "ai_services": ai_status
    }


@router.get("/settings")
async def get_settings_endpoint(current_user = Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Get system settings (admin only)
    """
    from app.models import SystemSetting
    
    settings_list = db.query(SystemSetting).all()
    
    return {
        "settings": [
            {
                "key": s.key,
                "value": s.value,
                "description": s.description,
                "category": s.category
            }
            for s in settings_list
        ]
    }



# ML Classifier Models
class MLPredictRequest(BaseModel):
    text: str


class MLPredictResponse(BaseModel):
    risk_score: float
    is_malicious: bool
    confidence: float
    model: str


class MLTrainRequest(BaseModel):
    texts: List[str]
    labels: List[int]  # 0=benign, 1=malicious


class MLStatusResponse(BaseModel):
    trained: bool
    model_path: str
    available: bool


# ML Classifier Endpoints
@router.get("/ml/status", response_model=MLStatusResponse)
async def ml_classifier_status(current_user = Depends(get_current_admin)):
    """
    Get ML classifier status (admin only)
    """
    classifier = get_classifier()
    return {
        "trained": classifier.trained,
        "model_path": classifier.model_path,
        "available": classifier.trained
    }


@router.post("/ml/predict", response_model=MLPredictResponse)
async def ml_predict(
    request: MLPredictRequest,
    current_user = Depends(get_current_admin)
):
    """
    Get ML classifier prediction (admin only)
    For testing/debugging purposes
    """
    classifier = get_classifier()
    
    if not classifier.trained:
        raise HTTPException(
            status_code=400,
            detail="ML classifier not trained. Run training script first."
        )
    
    prediction = classifier.predict(request.text)
    
    return {
        "risk_score": prediction["risk_score"],
        "is_malicious": prediction["is_malicious"],
        "confidence": prediction["confidence"],
        "model": prediction.get("model", "unknown")
    }


@router.post("/ml/train")
async def ml_train(
    request: MLTrainRequest,
    current_user = Depends(get_current_admin)
):
    """
    Train ML classifier (admin only)
    
    Note: For production, use the train_ml_classifier.py script instead
    This endpoint is for testing/experimentation only
    """
    if len(request.texts) != len(request.labels):
        raise HTTPException(
            status_code=400,
            detail="texts and labels must have the same length"
        )
    
    if len(request.texts) < 10:
        raise HTTPException(
            status_code=400,
            detail="Need at least 10 training examples"
        )
    
    try:
        classifier = get_classifier()
        classifier.train(request.texts, request.labels)
        
        return {
            "status": "success",
            "message": f"Classifier trained on {len(request.texts)} examples",
            "trained": classifier.trained,
            "model_path": classifier.model_path
        }
    
    except Exception as e:
        logger.error("ML training failed", exc_info=e)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
