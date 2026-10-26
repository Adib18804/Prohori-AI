"""
Embedding service for RAG and vector search
"""

from typing import List
import structlog
from openai import OpenAI

from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class EmbeddingService:
    """
    Service for generating text embeddings
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.embedding_model
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        """
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text
            )
            
            embedding = response.data[0].embedding
            
            logger.debug(
                "Generated embedding",
                model=self.model,
                text_length=len(text),
                embedding_dim=len(embedding)
            )
            
            return embedding
        
        except Exception as e:
            logger.error("Embedding generation failed", exc_info=e, text_length=len(text))
            raise
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (batch)
        """
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=texts
            )
            
            embeddings = [item.embedding for item in response.data]
            
            logger.debug(
                "Generated batch embeddings",
                model=self.model,
                batch_size=len(texts),
                embedding_dim=len(embeddings[0]) if embeddings else 0
            )
            
            return embeddings
        
        except Exception as e:
            logger.error("Batch embedding generation failed", exc_info=e, batch_size=len(texts))
            raise
    
    def get_dimension(self) -> int:
        """
        Get embedding dimension for the current model
        """
        # OpenAI text-embedding-3-small uses 1536 dimensions
        if "text-embedding-3-small" in self.model:
            return 1536
        elif "text-embedding-3-large" in self.model:
            return 3072
        elif "text-embedding-ada-002" in self.model:
            return 1536
        else:
            return 1536  # Default