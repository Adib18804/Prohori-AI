"""
SQLAlchemy models for Prohori AI
"""

from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, Text, 
    ForeignKey, DECIMAL, ARRAY, Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid

from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    plan_code = Column(String(30), default="free")
    free_uses_used = Column(Integer, default=0)
    free_uses_limit = Column(Integer, default=5)
    monthly_debate_count = Column(Integer, default=0)
    monthly_reset_at = Column(DateTime)
    stripe_customer_id = Column(String(100))

    # Trust & Warning System
    warnings_count = Column(Integer, default=0)
    last_warning_at = Column(DateTime(timezone=True))
    banned_until = Column(DateTime(timezone=True))
    ban_reason = Column(Text)
    total_violations = Column(Integer, default=0)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    protected_requests = relationship("ProtectedRequest", back_populates="user", cascade="all, delete-orphan")
    violation_logs = relationship("ViolationLog", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin', 'super_admin')", name="check_user_role"),
    )


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_name = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    protected_requests = relationship("ProtectedRequest", back_populates="session", cascade="all, delete-orphan")


class ProtectedRequest(Base):
    __tablename__ = "protected_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_prompt = Column(Text, nullable=False)
    prompt_hash = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Request metadata
    ip_address = Column(INET)
    user_agent = Column(Text)
    request_source = Column(String(100))

    # Relationships
    user = relationship("User", back_populates="protected_requests")
    session = relationship("Session", back_populates="protected_requests")
    triage_result = relationship("TriageResult", back_populates="request", uselist=False, cascade="all, delete-orphan")
    debates = relationship("Debate", back_populates="request", cascade="all, delete-orphan")
    verdicts = relationship("Verdict", back_populates="request", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="request", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_protected_requests_user_created", "user_id", "created_at"),
    )


class TriageResult(Base):
    __tablename__ = "triage_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("protected_requests.id", ondelete="CASCADE"), nullable=False, unique=True)
    classification = Column(String(50), nullable=False)
    risk_score = Column(DECIMAL(5, 4))
    requires_debate = Column(Boolean, nullable=False, default=False)
    attack_types = Column(ARRAY(Text))
    reason = Column(Text)
    model_used = Column(String(100))
    processing_time_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Metadata
    confidence = Column(DECIMAL(5, 4))
    evidence = Column(JSONB)

    # Relationships
    request = relationship("ProtectedRequest", back_populates="triage_result")

    __table_args__ = (
        CheckConstraint("classification IN ('SAFE', 'SUSPICIOUS', 'HIGH_RISK')", name="check_triage_classification"),
        CheckConstraint("risk_score >= 0 AND risk_score <= 1", name="check_triage_risk_score"),
        Index("idx_triage_results_classification", "classification"),
    )


class Debate(Base):
    __tablename__ = "debates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("protected_requests.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="initiated", nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True))
    total_processing_time_ms = Column(Integer)
    
    # Debate metadata
    rag_matches_found = Column(Integer, default=0)
    parallel_execution = Column(Boolean, default=True)

    # Relationships
    request = relationship("ProtectedRequest", back_populates="debates")
    agent_arguments = relationship("AgentArgument", back_populates="debate", cascade="all, delete-orphan")
    verdicts = relationship("Verdict", back_populates="debate", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('initiated', 'in_progress', 'completed', 'failed')", name="check_debate_status"),
        Index("idx_debates_status", "status"),
    )


class AgentArgument(Base):
    __tablename__ = "agent_arguments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    debate_id = Column(UUID(as_uuid=True), ForeignKey("debates.id", ondelete="CASCADE"), nullable=False)
    agent_type = Column(String(50), nullable=False)
    position = Column(String(20), nullable=False)
    risk_score = Column(DECIMAL(5, 4))
    confidence = Column(DECIMAL(5, 4))
    
    # Agent reasoning
    reasoning = Column(Text, nullable=False)
    evidence = Column(JSONB)
    attack_types = Column(ARRAY(Text))
    benign_interpretation = Column(Text)
    
    # Processing metadata
    model_used = Column(String(100))
    processing_time_ms = Column(Integer)
    rag_context = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    debate = relationship("Debate", back_populates="agent_arguments")

    __table_args__ = (
        CheckConstraint("agent_type IN ('prosecutor', 'defender')", name="check_agent_type"),
        CheckConstraint("position IN ('ALLOW', 'BLOCK', 'REDACT')", name="check_agent_position"),
        CheckConstraint("risk_score >= 0 AND risk_score <= 1", name="check_agent_risk_score"),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="check_agent_confidence"),
        Index("idx_agent_arguments_debate", "debate_id"),
        Index("idx_agent_arguments_agent_type", "agent_type"),
    )


class Verdict(Base):
    __tablename__ = "verdicts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    debate_id = Column(UUID(as_uuid=True), ForeignKey("debates.id", ondelete="CASCADE"), nullable=False)
    request_id = Column(UUID(as_uuid=True), ForeignKey("protected_requests.id", ondelete="CASCADE"), nullable=False)
    
    # Final decision
    verdict = Column(String(20), nullable=False)
    confidence = Column(DECIMAL(5, 4), nullable=False)
    risk_level = Column(String(20), nullable=False)
    
    # Attack classification
    attack_types = Column(ARRAY(Text), nullable=False, server_default='{}')
    primary_attack_type = Column(String(100))
    
    # Judge reasoning
    reason = Column(Text, nullable=False)
    evidence = Column(JSONB)
    recommended_action = Column(Text)
    
    # Redaction handling
    redacted_prompt = Column(Text)
    redaction_reason = Column(Text)
    
    # Processing metadata
    model_used = Column(String(100))
    processing_time_ms = Column(Integer)
    prosecutor_influence = Column(DECIMAL(5, 4))
    defender_influence = Column(DECIMAL(5, 4))
    rag_influence = Column(DECIMAL(5, 4))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    debate = relationship("Debate", back_populates="verdicts")
    request = relationship("ProtectedRequest", back_populates="verdicts")
    incidents = relationship("Incident", back_populates="verdict", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("verdict IN ('ALLOW', 'BLOCK', 'REDACT')", name="check_verdict"),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="check_verdict_confidence"),
        CheckConstraint("risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')", name="check_risk_level"),
        Index("idx_verdicts_verdict", "verdict"),
        Index("idx_verdicts_risk_level", "risk_level"),
    )


class AttackPattern(Base):
    __tablename__ = "attack_patterns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    attack_type = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(String(20))
    
    # Pattern content
    pattern_summary = Column(Text, nullable=False)
    example_indicators = Column(JSONB)
    
    # Source information
    source_type = Column(String(50))
    confirmed_incidents = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True, index=True)

    # Relationships
    embeddings = relationship("AttackPatternEmbedding", back_populates="attack_pattern", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')", name="check_pattern_severity"),
        CheckConstraint("source_type IN ('manual', 'confirmed_incident', 'research')", name="check_source_type"),
    )


class AttackPatternEmbedding(Base):
    __tablename__ = "attack_pattern_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attack_pattern_id = Column(UUID(as_uuid=True), ForeignKey("attack_patterns.id", ondelete="CASCADE"), nullable=False)
    embedding = Column(Vector(1536), nullable=False)
    embedding_model = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    attack_pattern = relationship("AttackPattern", back_populates="embeddings")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("protected_requests.id", ondelete="CASCADE"), nullable=False)
    verdict_id = Column(UUID(as_uuid=True), ForeignKey("verdicts.id", ondelete="CASCADE"), nullable=False)
    
    # Incident classification
    incident_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    status = Column(String(50), default="detected")
    
    # Human review
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_at = Column(DateTime(timezone=True))
    review_notes = Column(Text)
    human_verdict = Column(String(20))
    
    # Response actions
    actions_taken = Column(JSONB)
    escalated = Column(Boolean, default=False)
    escalation_reason = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    request = relationship("ProtectedRequest", back_populates="incidents")
    verdict = relationship("Verdict", back_populates="incidents")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    __table_args__ = (
        CheckConstraint("severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')", name="check_incident_severity"),
        CheckConstraint("status IN ('detected', 'investigating', 'confirmed', 'false_positive', 'resolved')", name="check_incident_status"),
        CheckConstraint("human_verdict IN ('CONFIRM_BLOCK', 'FALSE_POSITIVE', 'NEEDS_INVESTIGATION')", name="check_human_verdict"),
        Index("idx_incidents_severity", "severity"),
        Index("idx_incidents_status", "status"),
    )


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    request_id = Column(UUID(as_uuid=True), ForeignKey("protected_requests.id"))
    
    # Event details
    event_data = Column(JSONB, nullable=False)
    risk_level = Column(String(20))
    success = Column(Boolean, nullable=False)
    error_message = Column(Text)
    
    # Metadata
    ip_address = Column(INET)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(255), unique=True, nullable=False, index=True)
    value = Column(JSONB, nullable=False)
    description = Column(Text)
    category = Column(String(100))
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    updater = relationship("User", foreign_keys=[updated_by])


class Plan(Base):
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    monthly_debates = Column(Integer, nullable=False)
    billing_cycle = Column(String(20), default="monthly")
    category = Column(String(20), default="standard")
    discount_percent = Column(Integer, default=0)
    is_popular = Column(Boolean, default=False)
    savings_text = Column(String(100))
    features = Column(JSONB)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("billing_cycle IN ('weekly', 'monthly', 'yearly', 'lifetime', 'custom')", name="check_billing_cycle"),
        CheckConstraint("category IN ('standard', 'student', 'professional', 'business', 'enterprise')", name="check_category"),
    )


class Subscription(Base):
    """Current paid plan record. Simulated gateway IDs are explicitly non-Stripe."""
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False)
    status = Column(String(20), nullable=False, default="active")
    stripe_subscription_id = Column(String(120), unique=True, nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    plan = relationship("Plan")

    __table_args__ = (
        CheckConstraint("status IN ('active', 'canceled')", name="check_subscription_status"),
    )


class APIUsage(Base):
    __tablename__ = "api_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    requests_count = Column(Integer, default=1)
    debates_triggered = Column(Integer, default=0)
    total_tokens_used = Column(Integer, default=0)
    date = Column(DateTime(timezone=True), server_default=func.current_date())
    
    # Cost tracking
    estimated_cost_usd = Column(DECIMAL(10, 4), default=0)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])


class ViolationLog(Base):
    __tablename__ = "violation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(100))
    prompt = Column(Text, nullable=False)
    verdict = Column(String(20), nullable=False)
    confidence = Column(DECIMAL(5, 4))
    risk_level = Column(String(20))
    attack_types = Column(ARRAY(Text))
    warned = Column(Boolean, default=False)
    banned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="violation_logs")

    __table_args__ = (
        Index("idx_violation_logs_user_id", "user_id"),
        Index("idx_violation_logs_created_at", "created_at"),
    )
