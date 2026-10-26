-- Prohori AI Database Schema
-- Multi-Agent Explainable AI Security Gateway

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Protected requests table - all security evaluations
CREATE TABLE IF NOT EXISTS protected_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_prompt TEXT NOT NULL,
    prompt_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for deduplication
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    request_source VARCHAR(100) -- 'chat', 'api', 'test'
);

-- Triage results table
CREATE TABLE IF NOT EXISTS triage_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES protected_requests(id) ON DELETE CASCADE,
    classification VARCHAR(50) NOT NULL CHECK (classification IN ('SAFE', 'SUSPICIOUS', 'HIGH_RISK')),
    risk_score DECIMAL(5,4) CHECK (risk_score >= 0 AND risk_score <= 1),
    requires_debate BOOLEAN NOT NULL DEFAULT false,
    attack_types TEXT[], -- Array of detected attack types
    reason TEXT,
    model_used VARCHAR(100),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Triage agent metadata
    confidence DECIMAL(5,4),
    evidence JSONB
);

-- Debates table - orchestrates multi-agent discussions
CREATE TABLE IF NOT EXISTS debates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES protected_requests(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_processing_time_ms INTEGER,
    
    -- Debate metadata
    rag_matches_found INTEGER DEFAULT 0,
    parallel_execution BOOLEAN DEFAULT true
);

-- Agent arguments table - stores reasoning from each agent
CREATE TABLE IF NOT EXISTS agent_arguments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('prosecutor', 'defender')),
    position VARCHAR(20) NOT NULL CHECK (position IN ('ALLOW', 'BLOCK', 'REDACT')),
    risk_score DECIMAL(5,4) CHECK (risk_score >= 0 AND risk_score <= 1),
    confidence DECIMAL(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Agent reasoning
    reasoning TEXT NOT NULL,
    evidence JSONB, -- Structured evidence and citations
    attack_types TEXT[], -- Array of identified attack types
    benign_interpretation TEXT, -- Defender's alternative interpretation
    
    -- Processing metadata
    model_used VARCHAR(100),
    processing_time_ms INTEGER,
    rag_context JSONB, -- Retrieved attack patterns used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verdicts table - final judge decisions
CREATE TABLE IF NOT EXISTS verdicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES protected_requests(id) ON DELETE CASCADE,
    
    -- Final decision
    verdict VARCHAR(20) NOT NULL CHECK (verdict IN ('ALLOW', 'BLOCK', 'REDACT')),
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Attack classification
    attack_types TEXT[] NOT NULL DEFAULT '{}',
    primary_attack_type VARCHAR(100),
    
    -- Judge reasoning
    reason TEXT NOT NULL,
    evidence JSONB,
    recommended_action TEXT,
    
    -- Redaction handling
    redacted_prompt TEXT, -- Only if verdict = 'REDACT'
    redaction_reason TEXT,
    
    -- Processing metadata
    model_used VARCHAR(100),
    processing_time_ms INTEGER,
    prosecutor_influence DECIMAL(5,4), -- How much prosecutor influenced decision
    defender_influence DECIMAL(5,4), -- How much defender influenced decision
    rag_influence DECIMAL(5,4), -- How much RAG memory influenced decision
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attack patterns table - RAG knowledge base
CREATE TABLE IF NOT EXISTS attack_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    attack_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Pattern content
    pattern_summary TEXT NOT NULL, -- Anonymized attack description
    example_indicators JSONB, -- Key phrases, structures, techniques
    
    -- Source information
    source_type VARCHAR(50) CHECK (source_type IN ('manual', 'confirmed_incident', 'research')),
    confirmed_incidents INTEGER DEFAULT 0, -- How many times this pattern was confirmed
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Attack pattern embeddings table for vector search
CREATE TABLE IF NOT EXISTS attack_pattern_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attack_pattern_id UUID NOT NULL REFERENCES attack_patterns(id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small dimension
    embedding_model VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents table - confirmed security events
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES protected_requests(id) ON DELETE CASCADE,
    verdict_id UUID NOT NULL REFERENCES verdicts(id) ON DELETE CASCADE,
    
    -- Incident classification
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'confirmed', 'false_positive', 'resolved')),
    
    -- Human review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    human_verdict VARCHAR(20) CHECK (human_verdict IN ('CONFIRM_BLOCK', 'FALSE_POSITIVE', 'NEEDS_INVESTIGATION')),
    
    -- Response actions
    actions_taken JSONB, -- Array of response actions
    escalated BOOLEAN DEFAULT false,
    escalation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit events table - compliance and security logging
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- 'request_processed', 'verdict_rendered', 'pattern_matched', etc.
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES sessions(id),
    request_id UUID REFERENCES protected_requests(id),
    
    -- Event details
    event_data JSONB NOT NULL,
    risk_level VARCHAR(20),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'security', 'ai_models', 'thresholds', etc.
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    requests_count INTEGER DEFAULT 1,
    debates_triggered INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Cost tracking
    estimated_cost_usd DECIMAL(10,4) DEFAULT 0,
    
    PRIMARY KEY (user_id, endpoint, method, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_protected_requests_user_created ON protected_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_protected_requests_session ON protected_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_protected_requests_hash ON protected_requests(prompt_hash);

CREATE INDEX IF NOT EXISTS idx_triage_results_request ON triage_results(request_id);
CREATE INDEX IF NOT EXISTS idx_triage_results_classification ON triage_results(classification);
CREATE INDEX IF NOT EXISTS idx_triage_results_created ON triage_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_debates_request ON debates(request_id);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debates_created ON debates(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_arguments_debate ON agent_arguments(debate_id);
CREATE INDEX IF NOT EXISTS idx_agent_arguments_agent_type ON agent_arguments(agent_type);

CREATE INDEX IF NOT EXISTS idx_verdicts_request ON verdicts(request_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_verdict ON verdicts(verdict);
CREATE INDEX IF NOT EXISTS idx_verdicts_risk_level ON verdicts(risk_level);
CREATE INDEX IF NOT EXISTS idx_verdicts_created ON verdicts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attack_patterns_type ON attack_patterns(attack_type);
CREATE INDEX IF NOT EXISTS idx_attack_patterns_active ON attack_patterns(is_active);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_attack_pattern_embeddings_vector ON attack_pattern_embeddings USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attack_patterns_updated_at BEFORE UPDATE ON attack_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Security RLS policies (Row Level Security)
ALTER TABLE protected_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_own_data_policy ON protected_requests FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY user_own_sessions_policy ON sessions FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Admins can see all data
CREATE POLICY admin_all_access_policy ON protected_requests FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = current_setting('app.current_user_id')::UUID 
        AND role = 'admin'
    )
);

-- Initial admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO users (email, username, password_hash, role) VALUES 
    ('admin@prohori.ai', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.0.j5Y5J5Z5J5Z5J5Z', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Initial system settings
INSERT INTO system_settings (key, value, description, category) VALUES 
    ('auto_block_threshold', '0.90', 'Confidence threshold for automatic blocking', 'security'),
    ('debate_threshold', '0.70', 'Risk threshold for triggering full debate', 'security'),
    ('max_prompt_length', '10000', 'Maximum allowed prompt length', 'security'),
    ('enable_rag_memory', 'true', 'Enable RAG attack pattern matching', 'features'),
    ('enable_ml_classifier', 'false', 'Enable machine learning classifier', 'features')
ON CONFLICT (key) DO NOTHING;