"""Runtime system settings (spec #21): DB-persisted overrides of env defaults."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.config import settings as env_settings
from app.models import SystemSetting

KEY = "runtime"

FIELDS = {
    "auto_block_threshold": (float, 0.05, 0.99),
    "debate_threshold": (float, 0.0, 0.95),
    "max_prompt_length": (int, 50, 32000),
    "rate_limit_per_min": (int, 1, 600),
    "redaction_policy": (str, None, None),
    "security_mode": (str, None, None),
    "enable_rag": (bool, None, None),
    "enable_ml_signal": (bool, None, None),
}

ENUMS = {
    "redaction_policy": {"off", "moderate", "strict"},
    "security_mode": {"fail_closed", "fail_open"},
}


def defaults() -> dict:
    return {
        "auto_block_threshold": env_settings.auto_block_threshold,
        "debate_threshold": env_settings.debate_threshold,
        "max_prompt_length": env_settings.max_prompt_length,
        "rate_limit_per_min": env_settings.rate_limit_per_min,
        "redaction_policy": env_settings.redaction_policy,
        "security_mode": env_settings.security_mode,
        "enable_rag": env_settings.enable_rag,
        "enable_ml_signal": env_settings.enable_ml_signal,
        # read-only informational fields
        "agent_engine": env_settings.llm_provider,
        "models": {
            "triage": env_settings.triage_model,
            "prosecutor": env_settings.prosecutor_model,
            "defender": env_settings.defender_model,
            "judge": env_settings.judge_model,
            "embedding": env_settings.embedding_model,
            "target_llm": env_settings.target_llm_model,
        },
    }


def get_settings_dict(db: Session) -> dict:
    row = db.get(SystemSetting, KEY)
    merged = defaults()
    if row and isinstance(row.value, dict):
        for k, v in row.value.items():
            if k in merged and k != "models":
                merged[k] = v
    return merged


def get_policy(db: Session) -> dict:
    """The policy subset agents and the orchestrator consume."""
    s = get_settings_dict(db)
    return {k: s[k] for k in ("auto_block_threshold", "debate_threshold", "max_prompt_length",
                              "redaction_policy", "security_mode", "enable_rag", "enable_ml_signal")}


def update_settings(db: Session, patch: dict) -> dict:
    current = get_settings_dict(db)
    errors: dict[str, str] = {}
    clean: dict = {}
    for key, value in patch.items():
        if key not in FIELDS:
            errors[key] = "unknown setting"
            continue
        typ, low, high = FIELDS[key]
        try:
            if typ is bool:
                value = bool(value)
            elif typ is int:
                value = int(value)
                if low is not None and not (low <= value <= high):
                    raise ValueError(f"must be between {low} and {high}")
            elif typ is float:
                value = float(value)
                if low is not None and not (low <= value <= high):
                    raise ValueError(f"must be between {low} and {high}")
            else:
                value = str(value)
                if key in ENUMS and value not in ENUMS[key]:
                    raise ValueError(f"must be one of {sorted(ENUMS[key])}")
            clean[key] = value
        except (TypeError, ValueError) as exc:
            errors[key] = str(exc)
    if errors:
        raise ValueError(str(errors))
    row = db.get(SystemSetting, KEY)
    if row is None:
        row = SystemSetting(key=KEY, value={})
        db.add(row)
    stored = dict(row.value or {})
    stored.update(clean)
    row.value = stored
    db.commit()
    return get_settings_dict(db)
