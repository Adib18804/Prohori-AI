"""Deterministic rule/lexicon-based security analysis engine.

This is real signature-based detection computed from the actual prompt content —
it is the fallback intelligence for every agent role when no external LLM is
configured, and the fast-path signal source for Triage. It never returns canned
responses: every finding quotes which rule matched and where.
"""
from __future__ import annotations

import base64
import binascii
import math
import re
from dataclasses import dataclass, field

# --- Rule table: (rule_id, canonical attack type, compiled regex, weight, human description) ---

_RULES: list[tuple[str, str, re.Pattern, float, str]] = [
    # Instruction override / prompt injection
    ("override-ignore-previous", "instruction_override",
     re.compile(r"\b(ignore|disregard|forget|bypass|override)\b[^.?!]{0,40}\b(previous|prior|above|earlier|all|any|your)\b[^.?!]{0,20}\b(instructions?|prompts?|rules?|directions?|guidelines?|training)\b", re.I),
     0.85, "Asks the model to discard its prior instructions"),
    ("override-new-instructions", "instruction_override",
     re.compile(r"\b(new|updated|revised|real|actual|true)\s+(instructions?|directives?|system\s+prompt)\b", re.I),
     0.6, "Asserts replacement instructions"),
    ("injection-do-anything", "prompt_injection",
     re.compile(r"\b(do\s+anything|anything\s+now|no\s+restrictions?|without\s+restrictions?|no\s+limits?|unfiltered|uncensored|unrestricted)\b", re.I),
     0.8, "Requests the model drop its operating constraints"),
    ("injection-reveal-secret", "prompt_injection",
     re.compile(r"\b(reveal|show|print|repeat|output|expose|leak|share|display|disclose|divulge)\b[^.?!]{0,40}\b(system\s*prompt|initial\s*prompt|hidden\s*instructions?|secret\s*instructions?|your\s+instructions?|internal\s+instructions?| configuration)\b", re.I),
     0.85, "Asks the model to expose protected configuration"),
    ("injection-repeat-above", "indirect_prompt_injection",
     re.compile(r"\b(ignore\s+the\s+(above|previous)|disregard\s+the\s+(above|previous)|repeat\s+(everything\s+)?above|repeat\s+the\s+text\s+above)\b", re.I),
     0.75, "Classic indirect-injection phrasing targeting surrounding content"),
    ("injection-fake-boundary", "indirect_prompt_injection",
     re.compile(r"(<\|?im_start\|?>|<\|?endoftext\|?>|\[system\]|\[INST\]|<<\s*system\s*>>|###\s*system|begin\s+system\s+message|end\s+of\s+system)", re.I),
     0.8, "Fakes system/role boundary markers to smuggle instructions"),
    ("injection-developer-mode", "jailbreak",
     re.compile(r"\b(developer\s+mode|dan\s+mode|do\s+anything\s+now|aim\s+jailbreak|jailbreak)\b", re.I),
     0.7, "Named jailbreak technique"),
    ("jailbreak-persona-unrestricted", "jailbreak",
     re.compile(r"\b(act|pretend|behave|pose)\b[^.?!]{0,30}\bas\b[^.?!]{0,30}\b(an?\s+)?(unrestricted|unfiltered|uncensored|evil|amoral|unethical|harmless)\b", re.I)
     , 0.8, "Requests an unrestricted persona"),
    ("jailbreak-safety-off", "jailbreak",
     re.compile(r"\b(ignore|disable|turn\s+off|bypass|drop|remove)\b[^.?!]{0,30}\b(safety|safety\s+policies?|content\s+policies?|filters?|guardrails?|guidelines|ethics)\b", re.I),
     0.85, "Asks to disable safety policies"),
    ("jailbreak-dan", "jailbreak",
     re.compile(r"\byou\s+are\s+(dan|DAN)\b|\bstay\s+in\s+character\b[^.?!]{0,30}\banything\b", re.I),
     0.75, "DAN-style persona lock"),
    ("role-you-are-now", "role_manipulation",
     re.compile(r"\b(you\s+are\s+now|from\s+now\s+on\s+you\s+are|you\s+must\s+act\s+as|your\s+new\s+(role|persona|identity)|forget\s+you\s+are)\b", re.I),
     0.6, "Attempts to reassign the assistant role"),
    ("role-pretend", "role_manipulation",
     re.compile(r"\b(pretend|imagine)\b[^.?!]{0,30}\b(you\s+are|to\s+be)\b", re.I),
     0.4, "Roleplay framing (weak signal on its own)"),
    # Extraction
    ("extract-system-prompt", "system_prompt_extraction",
     re.compile(r"\b(system\s*prompt|system\s+instructions?|initial\s+instructions?|original\s+instructions?|hidden\s+instructions?|secret\s+prompt|your\s+prompt|underlying\s+instructions?|instructions\s+you\s+were\s+(given|trained)|what\s+you\s+were\s+told|meta\s+prompt)\b", re.I),
     0.8, "References protected instruction material"),
    ("extract-print-given", "system_prompt_extraction",
     re.compile(r"\b(print|output|repeat|echo|show|paste|copy|write\s+out)\b[^.?!]{0,50}\b(everything|all|the\s+text|the\s+words|the\s+message|the\s+prompt|the\s+instructions?)\b[^.?!]{0,40}\b(before|above|given|provided|hidden|initial|first)\b", re.I),
     0.75, "Requests verbatim reproduction of hidden text"),
    ("extract-opposite-mode", "system_prompt_extraction",
     re.compile(r"\b(enter|switch\s+to|go\s+into|enable)\b[^.?!]{0,25}\b(debug|diagnostic|developer|god|admin|sudo)\s+(mode|tool)\b", re.I),
     0.7, "Fake privileged-mode invocation"),
    # Data exfiltration
    ("exfil-send-external", "data_exfiltration",
     re.compile(r"\b(send|post|email|forward|upload|transfer|exfiltrate|transmit)\b[^.?!]{0,60}\b(api\s*key|credentials?|passwords?|secrets?|tokens?|conversation|this\s+chat|the\s+context|system\s*prompt|user\s+data|personal\s+data|all\s+of\s+it)\b[^.?!]{0,60}\b(to|at|via|through)\b", re.I),
     0.85, "Asks the model to transmit sensitive material to an external destination"),
    ("exfil-webhook-url", "data_exfiltration",
     re.compile(r"https?://[^\s]*(webhook|collect|telemetry|listener|receiver|exfil)[^\s]*", re.I),
     0.7, "Destination URL consistent with data collection"),
    ("exfil-encode-context", "data_exfiltration",
     re.compile(r"\b(encode|base64|compress|summarize)\b[^.?!]{0,50}\b(this\s+(conversation|chat|context|session)|everything\s+(above|so\s+far))\b[^.?!]{0,50}\b(send|include|attach|hide)\b", re.I),
     0.7, "Encodes conversation content for covert transport"),
    # Sensitive information
    ("sensitive-credentials", "sensitive_information_request",
     re.compile(r"\b(what\s+is|what's|give\s+me|show\s+me|tell\s+me|find|list|steal|grab|extract)\b[^.?!]{0,30}\b(the\s+)?(api\s*keys?|access\s*tokens?|passwords?|credit\s+card\s+numbers?|social\s+security\s+numbers?|ssn|database\s+credentials?|env(ironment)?\s+variables?|\.env\s+file)\b", re.I),
     0.8, "Requests credential-like material"),
    ("sensitive-personal-data", "sensitive_information_request",
     re.compile(r"\b(personal\s+(data|information)|customers?\s+(data|records|emails?|addresses)|credit\s+card|full\s+name\s+and\s+address)\b[^.?!]{0,40}\b(give|list|dump|export|reveal|show|extract|send)\b", re.I),
     0.7, "Requests bulk personal data"),
    # Multi-turn manipulation
    ("multiturn-earlier-agreement", "multi_turn_manipulation",
     re.compile(r"\b(as\s+(we|i)\s+(discussed|agreed|established|said)\s+(before|earlier)|you\s+(already\s+)?(agreed|promised|said)|earlier\s+you\s+(agreed|said|told)|remember\s+(what\s+we|our\s+agreement|you\s+promised)|continue\s+from\s+where\s+we\s+left\s+off\s+and\s+now)\b", re.I),
     0.6, "Fabricates prior agreement to lower resistance"),
    ("multiturn-gradual-escalation", "multi_turn_manipulation",
     re.compile(r"\b(now\s+that\s+you('|a)re\s+in\s+this\s+(mode|role|character)|now\s+drop\s+the\s+act|ok\s+now\s+do\s+it\s+for\s+real|next\s+step.{0,20}(ignore|bypass|reveal))\b", re.I),
     0.65, "Escalation phrasing building on earlier turns"),
]

# --- Obfuscation detectors -------------------------------------------------

_B64_RE = re.compile(r"\b[A-Za-z0-9+/=]{24,}\b")
_HEX_RE = re.compile(r"\b(?:[0-9a-fA-F]{2}){16,}\b")
_ROT13_HINT = re.compile(r"\b(rot13|caesar|decode|decipher|encrypted\s+message|the\s+following\s+is\s+encoded)\b", re.I)
_LEET = re.compile(r"\b[i1]gn0re|1gnore|ign0re|rev3al|r3veal|byt3|bytès\b", re.I)
_HOMOGLYPH_EXTRA = {"\u0430": "a", "\u0435": "e", "\u043e": "o", "\u0440": "p", "\u0441": "c",
                    "\u0456": "i", "\u0391": "A", "\u0395": "E", "\u039F": "O", "\u039C": "M"}


@dataclass
class Finding:
    rule_id: str
    attack_type: str
    weight: float
    description: str
    snippet: str
    start: int
    end: int


@dataclass
class AnalysisResult:
    risk_score: float
    attack_types: list[str]
    findings: list[Finding]
    obfuscation: dict = field(default_factory=dict)
    benign_research: bool = False
    benign_framing: list[str] = field(default_factory=list)
    contains_benign_clause: bool = False
    has_secret_like_strings: bool = False


def _sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-12 * (x - 0.5))) if -50 < x < 50 else (0.0 if x <= 0.5 else 1.0)


def _b64_decode_guarded(s: str) -> str:
    try:
        pad = "=" * (-len(s) % 4)
        return base64.b64decode(s + pad, validate=True).decode("utf-8", "ignore")
    except (binascii.Error, UnicodeDecodeError, ValueError):
        return ""


BENIGN_RESEARCH_PATTERNS = [
    (re.compile(r"\b(i'?m|i\s+am)\s+(studying|researching|learning\s+about|writing\s+(a\s+)?(paper|article|thesis)\s+about)\b", re.I), "Explicit study/research framing"),
    (re.compile(r"\b(explain|what\s+is|what\s+are|how\s+do(es)?|describe|teach\s+me|help\s+me\s+understand)\b[^.?!]{0,40}\b(prompt\s+injection|jailbreaks?|llm\s+security|ai\s+safety|prompt\s+security|red\s+team(ing)?)\b", re.I), "Asks for an explanation about a security concept"),
    (re.compile(r"\b(for\s+my\s+(class|course|homework|security\s+(class|course|training|audit|report)))\b", re.I), "Educational context stated"),
    (re.compile(r"\b(security\s+(research|researcher|team|review|assessment)|red[-\s]?team|penetration\s+test)\b", re.I), "Security-professional context stated"),
    (re.compile(r"\b(hypothetically|in\s+theory|conceptually|at\s+a\s+high\s+level)\b", re.I), "Hypothetical/conceptual framing"),
    (re.compile(r"\b(what\s+(is|are)\s+(a\s+)?(prompt\s+injection|jailbreak)|examples\s+of\s+(prompt\s+injection|jailbreaks))\b", re.I), "Definitional question about attack class"),
]

SECRET_LIKE_RE = re.compile(
    r"\b(sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|"
    r"eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.|-----BEGIN [A-Z ]*PRIVATE KEY-----)\b"
)


def analyze(prompt: str) -> AnalysisResult:
    """Run the full deterministic analysis over raw prompt text."""
    text = prompt or ""
    findings: list[Finding] = []

    # Homoglyph normalization for scanning (we report on the original text).
    normalized = text
    homo_hits = 0
    for bad, good in _HOMOGLYPH_EXTRA.items():
        if bad in normalized:
            homo_hits += normalized.count(bad)
            normalized = normalized.replace(bad, good)

    for rule_id, attack_type, regex, weight, description in _RULES:
        for m in regex.finditer(normalized):
            findings.append(Finding(rule_id, attack_type, weight, description,
                                    text[m.start():m.end()][:120], m.start(), m.end()))

    # --- Obfuscation ---
    obf: dict = {"base64_blobs": 0, "decoded_preview": "", "hex_blobs": 0, "rot13_hint": False,
                 "leet_hits": 0, "homoglyph_chars": homo_hits, "special_char_ratio": 0.0}
    decoded_attack = False
    b64s = _B64_RE.findall(text)
    for blob in b64s[:6]:
        decoded = _b64_decode_guarded(blob)
        if decoded and sum(c.isprintable() for c in decoded) / max(len(decoded), 1) > 0.85:
            obf["base64_blobs"] += 1
            if not obf["decoded_preview"]:
                obf["decoded_preview"] = decoded[:160]
            probe = analyze(decoded)
            if probe.attack_types:
                decoded_attack = True
    obf["hex_blobs"] = len(_HEX_RE.findall(text))
    obf["rot13_hint"] = bool(_ROT13_HINT.search(text))
    obf["leet_hits"] = len(_LEET.findall(normalized))
    letters = [c for c in text if c.isalnum() or c.isspace()]
    if text:
        special = sum(1 for c in text if not (c.isalnum() or c.isspace() or c in ".,?!'\"-:;()"))
        obf["special_char_ratio"] = round(special / max(len(text), 1), 3)

    obf_score = 0.0
    if decoded_attack:
        obf_score = max(obf_score, 0.9)
        findings.append(Finding("obf-encoded-instruction", "obfuscation", 0.9,
                                "Base64 payload decodes to instruction-like content",
                                (obf["decoded_preview"] or "encoded blob")[:120], 0, 0))
    elif obf["base64_blobs"] and obf["rot13_hint"]:
        obf_score = max(obf_score, 0.6)
    elif obf["rot13_hint"] or obf["leet_hits"] or obf["homoglyph_chars"]:
        obf_score = max(obf_score, 0.45)
    if obf["special_char_ratio"] > 0.35 and len(text) > 40:
        obf_score = max(obf_score, 0.4)

    if obf_score:
        findings.append(Finding("obfuscation-signals", "obfuscation", obf_score,
                                "Encoding/obfuscation signals present", "", 0, 0))

    # --- Benign research framing ---
    benign_framing = [desc for rx, desc in BENIGN_RESEARCH_PATTERNS if rx.search(normalized)]
    benign_research = len(benign_framing) >= 2 or (
        len(benign_framing) == 1 and not any(f.weight >= 0.75 for f in findings))

    # --- Mixed benign clause (for REDACT decisions) ---
    sentence_split = re.split(r"(?<=[.!?;])\s+|\n+", text)
    malicious_sentences: list[bool] = []
    for sent in sentence_split:
        s = sent.strip()
        if not s:
            continue
        sent_hits = any(rx.search(s) for _, _, rx, _, _ in _RULES)
        malicious_sentences.append(sent_hits)
    contains_benign_clause = any(not m for m in malicious_sentences) and any(m for m in malicious_sentences)

    # --- Secret-like strings ---
    has_secrets = bool(SECRET_LIKE_RE.search(text))

    # --- Aggregate risk ---
    score = 0.0
    for f in findings:
        score = max(score, f.weight) if f.weight >= 0.8 else max(score, f.weight * 0.92)
    if findings:
        weights = sorted((f.weight for f in findings), reverse=True)
        combined = weights[0] + 0.5 * sum(weights[1:3])
        score = min(0.99, _sigmoid(combined))
    if benign_research and score < 0.75:
        score *= 0.55

    attack_types: list[str] = []
    for f in sorted(findings, key=lambda x: -x.weight):
        if f.attack_type not in attack_types:
            attack_types.append(f.attack_type)

    return AnalysisResult(
        risk_score=round(min(score, 0.99), 3),
        attack_types=attack_types or (["benign"] if not findings else attack_types),
        findings=findings,
        obfuscation=obf,
        benign_research=benign_research,
        benign_framing=benign_framing,
        contains_benign_clause=contains_benign_clause,
        has_secret_like_strings=has_secrets,
    )


_CLAUSE_SPLIT_RE = re.compile(r"(?<=[.!?;])\s+|\n+|\s+and\s+then\s+|\s*;\s*|\s+then\s+", re.I)


def split_clauses(text: str) -> list[str]:
    return [s.strip() for s in _CLAUSE_SPLIT_RE.split(text or "") if s.strip()]


def _sentence_is_malicious(sentence: str) -> bool:
    hit = any(rx.search(sentence) for _, _, rx, _, _ in _RULES)
    return hit or bool(SECRET_LIKE_RE.search(sentence))
