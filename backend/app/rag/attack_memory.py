"""
Attack Memory - RAG knowledge base of attack patterns
"""

import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import hashlib
import structlog

from app.models import AttackPattern, ProtectedRequest, Verdict
from app.rag.vector_store import VectorStore
from app.config import get_settings
from app.rag.serper_search import SerperSearchService

logger = structlog.get_logger(__name__)
settings = get_settings()


class AttackMemory:
    """
    Attack memory system with RAG retrieval
    
    Features:
    - Store anonymized attack patterns
    - Similarity search for matching attacks
    - Learn from confirmed incidents
    - Never store raw customer data
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.vector_store = VectorStore(db)

    async def _log_live_threat_references(self, attack_type: str) -> None:
        """Run the optional network lookup outside the request's critical path."""
        try:
            query = f"{attack_type.replace('_', ' ')} prompt injection"
            live_results = await SerperSearchService().search_live_threats(query)
            logger.info("Live threat references retrieved", attack_type=attack_type, results=live_results)
        except Exception as search_error:
            logger.warning("Live threat lookup skipped", error=str(search_error)[:200])
    
    async def find_similar_attacks(
        self,
        prompt: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find similar attack patterns from memory
        """
        if not settings.enable_rag_memory:
            logger.debug("RAG memory disabled")
            return []
        
        try:
            matches = await self.vector_store.similarity_search(
                query_text=prompt,
                top_k=top_k,
                similarity_threshold=settings.rag_similarity_threshold
            )
            
            return matches
        
        except Exception as e:
            logger.error("Failed to retrieve similar attacks", exc_info=e)
            return []
    
    async def add_attack_pattern(
        self,
        name: str,
        attack_type: str,
        description: str,
        pattern_summary: str,
        severity: str = "MEDIUM",
        source_type: str = "manual",
        example_indicators: Optional[Dict] = None
    ) -> AttackPattern:
        """
        Add new attack pattern to memory
        
        Args:
            name: Pattern name
            attack_type: Type from taxonomy
            description: Human-readable description
            pattern_summary: Anonymized summary (no PII/secrets)
            severity: LOW|MEDIUM|HIGH|CRITICAL
            source_type: manual|confirmed_incident|research
            example_indicators: Optional dict of indicators
        """
        # Create pattern
        pattern = AttackPattern(
            name=name,
            attack_type=attack_type,
            description=description,
            pattern_summary=pattern_summary,
            severity=severity,
            source_type=source_type,
            example_indicators=example_indicators or {},
            confirmed_incidents=0,
            is_active=True
        )
        
        self.db.add(pattern)
        self.db.commit()
        self.db.refresh(pattern)
        
        # Generate and store embedding
        # Use pattern_summary for embedding (anonymized)
        embed_text = f"{name}. {description}. {pattern_summary}"
        await self.vector_store.add_pattern(pattern, embed_text)
        
        logger.info(
            "Added attack pattern to memory",
            pattern_id=str(pattern.id),
            name=name,
            attack_type=attack_type
        )
        
        return pattern
    
    async def learn_from_incident(
        self,
        request: ProtectedRequest,
        verdict: Verdict
    ) -> Optional[AttackPattern]:
        """
        Learn from confirmed malicious incident
        
        Creates anonymized attack pattern from blocked request
        NEVER stores raw customer prompts
        """
        if verdict.verdict != "BLOCK" or verdict.confidence < 0.85:
            logger.debug("Incident not suitable for learning", verdict=verdict.verdict)
            return None

        if not settings.enable_rag_memory:
            logger.debug("RAG memory disabled, skipping incident learning")
            return None

        try:
            # Create anonymized summary
            attack_types = verdict.attack_types or []
            primary_attack = verdict.primary_attack_type or attack_types[0] if attack_types else "other_suspicious"
            
            # Generate pattern summary (anonymized)
            pattern_summary = self._anonymize_prompt(
                request.original_prompt,
                attack_types=attack_types,
                reason=verdict.reason
            )
            
            # Check if similar pattern already exists
            existing_matches = await self.find_similar_attacks(pattern_summary, top_k=1)
            
            if existing_matches and existing_matches[0]["similarity"] > 0.95:
                # Update existing pattern
                existing_id = existing_matches[0]["id"]
                existing_pattern = self.db.query(AttackPattern).filter(
                    AttackPattern.id == existing_id
                ).first()
                
                if existing_pattern:
                    existing_pattern.confirmed_incidents += 1
                    self.db.commit()
                    
                    logger.info(
                        "Updated existing attack pattern",
                        pattern_id=str(existing_pattern.id),
                        confirmed_incidents=existing_pattern.confirmed_incidents
                    )
                    asyncio.create_task(self._log_live_threat_references(primary_attack))
                    return existing_pattern
            
            # Create new pattern
            pattern_name = f"Confirmed {primary_attack.replace('_', ' ').title()}"
            
            pattern = await self.add_attack_pattern(
                name=pattern_name,
                attack_type=primary_attack,
                description=verdict.reason[:500],
                pattern_summary=pattern_summary,
                severity=verdict.risk_level,
                source_type="confirmed_incident",
                example_indicators={
                    "verdict_confidence": float(verdict.confidence),
                    "evidence": verdict.evidence[:3] if verdict.evidence else []
                }
            )

            # Run threat intel only after local persistence, without delaying the request.
            asyncio.create_task(self._log_live_threat_references(primary_attack))
            
            return pattern
        
        except Exception as e:
            logger.error("Failed to learn from incident", exc_info=e)
            return None
    
    def _anonymize_prompt(
        self,
        prompt: str,
        attack_types: List[str],
        reason: str
    ) -> str:
        """
        Create anonymized summary of malicious prompt
        
        Removes:
        - PII (emails, names, addresses)
        - Secrets (API keys, passwords)
        - Company-specific information
        
        Preserves:
        - Attack structure
        - Manipulation techniques
        - General patterns
        """
        # Simple anonymization (production would use more sophisticated NER)
        
        # Hash any potential secrets
        lines = prompt.split('\n')
        anonymized_lines = []
        
        for line in lines[:10]:  # Limit to first 10 lines
            # Remove potential secrets
            if any(keyword in line.lower() for keyword in ['api_key', 'password', 'token', 'secret']):
                anonymized_lines.append("[REDACTED CREDENTIAL LINE]")
            # Remove potential PII
            elif '@' in line and '.' in line:
                anonymized_lines.append("[REDACTED EMAIL/URL]")
            # Keep attack structure
            elif any(keyword in line.lower() for keyword in ['ignore', 'override', 'forget', 'system', 'instructions']):
                anonymized_lines.append(line[:200])  # Keep but truncate
            else:
                # Genericize
                anonymized_lines.append(line[:100])
        
        anonymized = '\n'.join(anonymized_lines)
        
        # Add attack type context
        summary = f"Attack pattern: {', '.join(attack_types)}. Behavior: {reason[:200]}. Structure: {anonymized[:300]}"
        
        return summary
    
    async def get_memory_stats(self) -> Dict[str, Any]:
        """
        Get statistics about attack memory
        """
        total_patterns = self.db.query(AttackPattern).filter(
            AttackPattern.is_active == True
        ).count()
        
        patterns_by_type = {}
        for pattern in self.db.query(AttackPattern).filter(AttackPattern.is_active == True):
            patterns_by_type[pattern.attack_type] = patterns_by_type.get(pattern.attack_type, 0) + 1
        
        return {
            "total_patterns": total_patterns,
            "patterns_by_type": patterns_by_type,
            "embedding_model": self.vector_store.embedding_service.model
        }
