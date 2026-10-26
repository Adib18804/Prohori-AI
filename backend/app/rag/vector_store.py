"""
Vector store for pgvector similarity search
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
import structlog

from app.models import AttackPattern, AttackPatternEmbedding
from app.ai.embeddings import EmbeddingService

logger = structlog.get_logger(__name__)


class VectorStore:
    """
    Vector store for similarity search using pgvector
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.embedding_service = EmbeddingService()
    
    async def add_pattern(
        self,
        pattern: AttackPattern,
        text_to_embed: str
    ) -> AttackPatternEmbedding:
        """
        Add attack pattern with embedding to vector store
        """
        # Generate embedding
        embedding = await self.embedding_service.generate_embedding(text_to_embed)
        
        # Create embedding record
        pattern_embedding = AttackPatternEmbedding(
            attack_pattern_id=pattern.id,
            embedding=embedding,
            embedding_model=self.embedding_service.model
        )
        
        self.db.add(pattern_embedding)
        self.db.commit()
        
        logger.info(
            "Added pattern to vector store",
            pattern_id=str(pattern.id),
            pattern_name=pattern.name,
            embedding_dim=len(embedding)
        )
        
        return pattern_embedding
    
    async def similarity_search(
        self,
        query_text: str,
        top_k: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Find similar attack patterns using cosine similarity
        
        Returns list of matches with pattern details and similarity scores
        """
        # Generate query embedding
        query_embedding = await self.embedding_service.generate_embedding(query_text)
        
        # Perform similarity search using pgvector
        # Using cosine distance: 1 - cosine_similarity
        query = text("""
            SELECT 
                ap.id,
                ap.name,
                ap.attack_type,
                ap.description,
                ap.pattern_summary,
                ap.severity,
                ap.confirmed_incidents,
                ape.embedding,
                (1 - (ape.embedding <=> :query_embedding)) as similarity
            FROM attack_patterns ap
            JOIN attack_pattern_embeddings ape ON ap.id = ape.attack_pattern_id
            WHERE ap.is_active = true
            ORDER BY ape.embedding <=> :query_embedding
            LIMIT :top_k
        """)
        
        result = self.db.execute(
            query,
            {
                "query_embedding": str(query_embedding),
                "top_k": top_k
            }
        )
        
        matches = []
        for row in result:
            similarity = float(row.similarity)
            
            # Filter by threshold
            if similarity < similarity_threshold:
                continue
            
            matches.append({
                "id": str(row.id),
                "name": row.name,
                "attack_type": row.attack_type,
                "description": row.description,
                "pattern_summary": row.pattern_summary,
                "severity": row.severity,
                "confirmed_incidents": row.confirmed_incidents,
                "similarity": similarity
            })
        
        logger.info(
            "Similarity search completed",
            query_length=len(query_text),
            matches_found=len(matches),
            top_similarity=matches[0]["similarity"] if matches else 0
        )
        
        return matches
    
    async def batch_add_patterns(
        self,
        patterns_with_text: List[tuple]  # [(pattern, text_to_embed), ...]
    ) -> List[AttackPatternEmbedding]:
        """
        Batch add patterns with embeddings
        """
        texts = [text for _, text in patterns_with_text]
        
        # Generate embeddings in batch
        embeddings = await self.embedding_service.generate_embeddings(texts)
        
        pattern_embeddings = []
        for (pattern, _), embedding in zip(patterns_with_text, embeddings):
            pattern_embedding = AttackPatternEmbedding(
                attack_pattern_id=pattern.id,
                embedding=embedding,
                embedding_model=self.embedding_service.model
            )
            self.db.add(pattern_embedding)
            pattern_embeddings.append(pattern_embedding)
        
        self.db.commit()
        
        logger.info(
            "Batch added patterns to vector store",
            count=len(pattern_embeddings)
        )
        
        return pattern_embeddings