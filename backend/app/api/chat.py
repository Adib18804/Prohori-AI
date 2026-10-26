"""
Chat conversations API
CRUD operations for user chat sessions/conversations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.api.deps import get_current_user
from app.models import User, Session as SessionModel

router = APIRouter()


class ConversationCreate(BaseModel):
    name: Optional[str] = "New Conversation"


class ConversationUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class ConversationResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    is_active: bool


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all conversations for the current user"""
    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.updated_at.desc())
        .all()
    )
    
    return [
        ConversationResponse(
            id=str(s.id),
            name=s.session_name or "Conversation",
            created_at=s.created_at,
            updated_at=s.updated_at,
            is_active=s.is_active,
        )
        for s in sessions
    ]


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new conversation"""
    session = SessionModel(
        user_id=current_user.id,
        session_name=conversation.name or "New Conversation",
        is_active=True,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return ConversationResponse(
        id=str(session.id),
        name=session.session_name,
        created_at=session.created_at,
        updated_at=session.updated_at,
        is_active=session.is_active,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific conversation"""
    session = (
        db.query(SessionModel)
        .filter(
            SessionModel.id == conversation_id,
            SessionModel.user_id == current_user.id,
        )
        .first()
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return ConversationResponse(
        id=str(session.id),
        name=session.session_name,
        created_at=session.created_at,
        updated_at=session.updated_at,
        is_active=session.is_active,
    )


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    update: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a conversation"""
    session = (
        db.query(SessionModel)
        .filter(
            SessionModel.id == conversation_id,
            SessionModel.user_id == current_user.id,
        )
        .first()
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if update.name is not None:
        session.session_name = update.name
    if update.is_active is not None:
        session.is_active = update.is_active
    
    db.commit()
    db.refresh(session)
    
    return ConversationResponse(
        id=str(session.id),
        name=session.session_name,
        created_at=session.created_at,
        updated_at=session.updated_at,
        is_active=session.is_active,
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a conversation"""
    session = (
        db.query(SessionModel)
        .filter(
            SessionModel.id == conversation_id,
            SessionModel.user_id == current_user.id,
        )
        .first()
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(session)
    db.commit()
    
    return {"status": "deleted", "id": conversation_id}
