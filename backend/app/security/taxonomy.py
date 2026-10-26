"""
Attack taxonomy and classification
"""

from enum import Enum
from typing import List, Dict


class AttackType(str, Enum):
    """Attack type taxonomy"""
    BENIGN = "benign"
    PROMPT_INJECTION = "prompt_injection"
    JAILBREAK = "jailbreak"
    SYSTEM_PROMPT_EXTRACTION = "system_prompt_extraction"
    INSTRUCTION_OVERRIDE = "instruction_override"
    ROLE_MANIPULATION = "role_manipulation"
    DATA_EXFILTRATION = "data_exfiltration"
    SENSITIVE_INFO_REQUEST = "sensitive_info_request"
    OBFUSCATION = "obfuscation"
    MULTI_TURN_MANIPULATION = "multi_turn_manipulation"
    INDIRECT_INJECTION = "indirect_injection"
    OTHER_SUSPICIOUS = "other_suspicious"


class RiskLevel(str, Enum):
    """Risk level classification"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class VerdictType(str, Enum):
    """Final verdict types"""
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    REDACT = "REDACT"


class TriageClassification(str, Enum):
    """Triage agent classifications"""
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    HIGH_RISK = "HIGH_RISK"


class AttackTaxonomy:
    """
    Central taxonomy for attack classification and risk assessment
    """
    
    ATTACK_SEVERITY: Dict[AttackType, RiskLevel] = {
        AttackType.BENIGN: RiskLevel.LOW,
        AttackType.PROMPT_INJECTION: RiskLevel.HIGH,
        AttackType.JAILBREAK: RiskLevel.HIGH,
        AttackType.SYSTEM_PROMPT_EXTRACTION: RiskLevel.CRITICAL,
        AttackType.INSTRUCTION_OVERRIDE: RiskLevel.HIGH,
        AttackType.ROLE_MANIPULATION: RiskLevel.MEDIUM,
        AttackType.DATA_EXFILTRATION: RiskLevel.CRITICAL,
        AttackType.SENSITIVE_INFO_REQUEST: RiskLevel.MEDIUM,
        AttackType.OBFUSCATION: RiskLevel.MEDIUM,
        AttackType.MULTI_TURN_MANIPULATION: RiskLevel.HIGH,
        AttackType.INDIRECT_INJECTION: RiskLevel.HIGH,
        AttackType.OTHER_SUSPICIOUS: RiskLevel.MEDIUM,
    }
    
    ATTACK_DESCRIPTIONS: Dict[AttackType, str] = {
        AttackType.BENIGN: "No security concerns detected",
        AttackType.PROMPT_INJECTION: "Attempt to inject malicious instructions into the prompt",
        AttackType.JAILBREAK: "Attempt to bypass safety constraints or ethical guidelines",
        AttackType.SYSTEM_PROMPT_EXTRACTION: "Attempt to extract system instructions or configuration",
        AttackType.INSTRUCTION_OVERRIDE: "Attempt to override existing instructions",
        AttackType.ROLE_MANIPULATION: "Attempt to manipulate AI agent role or behavior",
        AttackType.DATA_EXFILTRATION: "Attempt to extract sensitive or protected data",
        AttackType.SENSITIVE_INFO_REQUEST: "Request for potentially sensitive information",
        AttackType.OBFUSCATION: "Use of encoding or obfuscation to hide malicious intent",
        AttackType.MULTI_TURN_MANIPULATION: "Multi-step attack across conversation turns",
        AttackType.INDIRECT_INJECTION: "Injection through external or indirect content",
        AttackType.OTHER_SUSPICIOUS: "Suspicious behavior not matching known patterns",
    }
    
    @classmethod
    def get_risk_level(cls, attack_types: List[AttackType]) -> RiskLevel:
        """
        Determine overall risk level from multiple attack types
        """
        if not attack_types:
            return RiskLevel.LOW
        
        # Get highest severity
        severities = [cls.ATTACK_SEVERITY.get(at, RiskLevel.MEDIUM) for at in attack_types]
        
        if RiskLevel.CRITICAL in severities:
            return RiskLevel.CRITICAL
        elif RiskLevel.HIGH in severities:
            return RiskLevel.HIGH
        elif RiskLevel.MEDIUM in severities:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    @classmethod
    def get_description(cls, attack_type: AttackType) -> str:
        """
        Get human-readable description of attack type
        """
        return cls.ATTACK_DESCRIPTIONS.get(attack_type, "Unknown attack type")
    
    @classmethod
    def should_auto_block(cls, attack_types: List[AttackType], confidence: float, threshold: float = 0.90) -> bool:
        """
        Determine if request should be automatically blocked
        """
        if confidence < threshold:
            return False
        
        risk_level = cls.get_risk_level(attack_types)
        
        # Auto-block critical and high-risk attacks with high confidence
        if risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH] and confidence >= threshold:
            return True
        
        return False