"""
Redaction engine for removing sensitive content
"""

import re
import structlog

logger = structlog.get_logger(__name__)

# Pattern to detect secrets (API keys, tokens, etc.)
SECRET_LIKE_RE = re.compile(
    r'(sk-[a-zA-Z0-9]{20,}|'  # OpenAI-style keys
    r'[a-zA-Z0-9]{32,}|'  # Generic long tokens
    r'Bearer\s+[a-zA-Z0-9\-._~+/]+=*|'  # Bearer tokens
    r'password\s*[:=]\s*[^\s]+)',  # Password assignments
    re.IGNORECASE
)

REDACTION_NOTICE = "[REDACTED BY PROHORI AI]"


def redact_pii(text: str) -> str:
    """
    Redact personally identifiable information (PII) from text
    
    Args:
        text: Input text
    
    Returns:
        Text with PII redacted
    """
    if not text:
        return text
    
    # Email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    
    # Phone numbers
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)
    
    # API keys and secrets
    text = SECRET_LIKE_RE.sub('[API_KEY]', text)
    
    # Credit card numbers
    text = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CARD]', text)
    
    # SSN
    text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]', text)
    
    return text


def redact_prompt(prompt: str, policy: str = "moderate") -> tuple[str, list[str]]:
    """
    Return (sanitized_prompt, list_of_redaction_actions)
    
    policy:
      off      -> only scrub credential-like strings
      moderate -> scrub secrets (default)
      strict   -> scrub secrets + remove sensitive data requests
    """
    actions: list[str] = []
    if not prompt or not prompt.strip():
        return "", actions
    
    # Always redact secrets
    sanitized = SECRET_LIKE_RE.sub(REDACTION_NOTICE, prompt)
    if sanitized != prompt:
        actions.append("Scrubbed credential-like string from prompt")
    
    # Strict policy: also check for sensitive data requests
    if policy == "strict":
        sensitive_patterns = [
            r'\b(api\s*keys?|passwords?|credentials?|tokens?|social\s+security)\b'
        ]
        for pattern in sensitive_patterns:
            if re.search(pattern, sanitized, re.IGNORECASE):
                sanitized = re.sub(pattern, REDACTION_NOTICE, sanitized, flags=re.IGNORECASE)
                actions.append("Strict policy: removed sensitive-data request")
    
    if not sanitized.strip():
        sanitized = "[No benign content remained after redaction]"
        actions.append("Entire prompt was redacted")
    
    return sanitized, actions


def redact_for_llm(prompt: str) -> str:
    """
    Sanitize a prompt before it reaches the protected LLM when the Judge said REDACT
    
    Args:
        prompt: Original prompt
    
    Returns:
        Redacted prompt safe for LLM consumption
    """
    sanitized, actions = redact_prompt(prompt, policy="moderate")
    
    if actions:
        logger.info("Redacted prompt for LLM", actions=actions)
    
    return sanitized
