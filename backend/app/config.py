"""
Configuration management for Prohori AI
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from functools import lru_cache


# Resolve .env path relative to this file
# config.py is in backend/app/, .env is in project root (two levels up)
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    log_level: str = "INFO"
    
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/prohori"
    
    # Authentication
    jwt_secret: str = "change_me_in_production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # AI Configuration (OpenAI)
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    embedding_model: str = "text-embedding-3-small"
    
    # AI Configuration (Groq — FREE primary)
    groq_api_key: Optional[str] = None
    groq_base_url: str = "https://api.groq.com/openai/v1"
    
    # AI Configuration (Mistral — FREE fallback)
    mistral_api_key: Optional[str] = None
    mistral_base_url: str = "https://api.mistral.ai/v1"

    # Optional fallback models and live threat intelligence.
    gemini_api_key: str = ""
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    serper_api_key: str = ""
    serper_base_url: str = "https://google.serper.dev/search"

    # AI Configuration (Nova — University AI gateway, PRIMARY)
    nova_api_key: Optional[str] = None
    nova_base_url: str = "https://nova.zohirrayhan.me/api/chat"
    # NOTE: 'nova_c' is currently disabled gateway-side (503 model_disabled).
    # 'nova_g' is the enabled model id. Override via NOVA_MODEL in .env.
    nova_model: str = "nova_g"
    
    # Model Selection
    triage_model: str = "openai/gpt-oss-20b"
    prosecutor_model: str = "openai/gpt-oss-120b"
    defender_model: str = "openai/gpt-oss-120b"
    judge_model: str = "openai/gpt-oss-120b"
    assistant_model: str = "openai/gpt-oss-120b"  # Protected LLM for user conversations
    
    # Security Thresholds
    max_prompt_length: int = 10000
    auto_block_threshold: float = 0.90
    debate_threshold: float = 0.70
    rag_similarity_threshold: float = 0.80
    
    # Rate Limiting
    requests_per_minute: int = 60
    debates_per_hour: int = 100
    
    # Features
    enable_ml_classifier: bool = False
    enable_rag_memory: bool = True
    enable_real_time_updates: bool = True
    
    # Vector Database
    vector_dimension: int = 1536
    
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache()
def get_settings():
    return Settings()
