"""
Pytest configuration and fixtures
"""

import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
from app.config import get_settings

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_db():
    """Create test database"""
    engine = create_engine(TEST_DATABASE_URL, echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    yield TestingSessionLocal
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(test_db):
    """Create database session for tests"""
    session = test_db()
    yield session
    session.close()


@pytest.fixture
def test_settings():
    """Override settings for testing"""
    settings = get_settings()
    settings.environment = "test"
    settings.enable_rag_memory = False  # Disable RAG for unit tests
    return settings
