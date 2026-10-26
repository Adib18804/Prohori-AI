"""Dashboard analytics — every number computed from the database (spec: no fabricated metrics)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import ApiUsage, Debate, Incident, ProtectedRequest, SystemSetting, Verdict
from app.services.settings_service import get_settings_dict

EVAL_KEY = "latest_evaluation"


def latest_evaluation(db: Session) -> dict | None:
    row = db.get(SystemSetting, EVAL_KEY)
    return row.value if row and isinstance(row.value, dict) else None


def build_analytics(db: Session, days: int = 14) -> dict:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)

    total = db.query(ProtectedRequest).count()
    by_action = dict(db.query(ProtectedRequest.final_action, func.count())
                     .group_by(ProtectedRequest.final_action).all())
    high_risk = db.query(ProtectedRequest).filter(ProtectedRequest.risk_level == "HIGH").count()
    debated = db.query(ProtectedRequest).filter(ProtectedRequest.debate_happened.is_(True)).count()
    flagged = db.query(ProtectedRequest).filter(ProtectedRequest.flagged_for_review.is_(True)).count()
    avg_latency = db.query(func.avg(ProtectedRequest.total_latency_ms)).scalar() or 0.0
    avg_fastlane = db.query(func.avg(ProtectedRequest.total_latency_ms)) \
        .filter(ProtectedRequest.debate_happened.is_(False)).scalar() or 0.0

    # Requests over time (last N days)
    series: list[dict] = []
    for offset in range(days - 1, -1, -1):
        day = (now - timedelta(days=offset)).date()
        day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        q = db.query(ProtectedRequest).filter(ProtectedRequest.created_at >= day_start,
                                              ProtectedRequest.created_at < day_end)
        row_counts = dict(db.query(ProtectedRequest.final_action, func.count())
                          .filter(ProtectedRequest.created_at >= day_start,
                                  ProtectedRequest.created_at < day_end)
                          .group_by(ProtectedRequest.final_action).all())
        series.append({"date": day.isoformat(), "total": sum(row_counts.values()),
                       "allowed": row_counts.get("ALLOW", 0), "blocked": row_counts.get("BLOCK", 0),
                       "redacted": row_counts.get("REDACT", 0)})

    # Attack categories from verdict attack_types + incidents
    attack_counts: dict[str, int] = {}
    verdict_rows = db.query(Verdict).all()
    for v in verdict_rows:
        for t in (v.attack_types or []):
            if t != "benign":
                attack_counts[t] = attack_counts.get(t, 0) + 1
    pattern_counts: dict[str, int] = {}
    for (matches,) in db.query(Debate.rag_matches).all():
        for m in matches or []:
            if m.get("similarity", 0) >= 0.75:
                name = m.get("pattern", "?")
                pattern_counts[name] = pattern_counts.get(name, 0) + 1
    top_patterns = sorted(pattern_counts.items(), key=lambda kv: -kv[1])[:8]

    risk_counts = dict(db.query(ProtectedRequest.risk_level, func.count())
                       .group_by(ProtectedRequest.risk_level).all())

    # Agent latency (from debates)
    from app.models import AgentArgument
    args = (db.query(AgentArgument.agent, func.avg(AgentArgument.latency_ms))
            .group_by(AgentArgument.agent).all())
    agent_latency = {agent: round(avg or 0, 1) for agent, avg in args}
    triage_avg = db.query(func.avg(ProtectedRequest.triage_latency_ms)).scalar() or 0.0
    agent_latency.setdefault("triage", round(float(triage_avg), 1))

    incidents = (db.query(Incident).order_by(Incident.created_at.desc()).limit(10).all())
    recent = [{
        "id": i.id, "request_id": i.request_id, "session_id": i.session_id,
        "attack_type": i.attack_type, "severity": i.severity, "verdict": i.verdict,
        "confidence": i.confidence, "status": i.status, "created_at": i.created_at.isoformat(),
    } for i in incidents]

    evaluation = latest_evaluation(db)
    detection_rate = ((by_action.get("BLOCK", 0) + by_action.get("REDACT", 0)) / total) if total else 0.0
    debate_rate = (debated / total) if total else 0.0

    usage = db.query(func.count(ApiUsage.id), func.avg(ApiUsage.latency_ms)).first()

    return {
        "generated_at": now.isoformat(),
        "cards": {
            "total_requests": total,
            "allowed": by_action.get("ALLOW", 0),
            "blocked": by_action.get("BLOCK", 0),
            "redacted": by_action.get("REDACT", 0),
            "high_risk": high_risk,
            "flagged_for_review": flagged,
            "debate_rate": round(debate_rate, 3),
            "avg_decision_time_ms": round(float(avg_latency), 1),
            "avg_fastlane_time_ms": round(float(avg_fastlane), 1),
            "attack_detection_rate": round(detection_rate, 3),
        },
        "series": series,
        "verdict_distribution": {
            "ALLOW": by_action.get("ALLOW", 0), "BLOCK": by_action.get("BLOCK", 0),
            "REDACT": by_action.get("REDACT", 0)},
        "attack_categories": sorted(
            [{"type": k, "count": v} for k, v in attack_counts.items()], key=lambda x: -x["count"])[:10],
        "risk_distribution": {k: risk_counts.get(k, 0) for k in ("LOW", "MEDIUM", "HIGH")},
        "top_attack_patterns": [{"pattern": k, "count": v} for k, v in top_patterns],
        "agent_latency": agent_latency,
        "recent_incidents": recent,
        "evaluation": evaluation,
        "api_usage": {"total_calls": int(usage[0] or 0), "avg_latency_ms": round(float(usage[1] or 0), 1)},
        "window_days": days,
    }
