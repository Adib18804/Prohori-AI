"""One-click audit report (spec #20): JSON + professional PDF export.

Includes verdict distribution, attack categories, top patterns, debate stats,
latency, false-positive/negative metrics when a real evaluation exists, a
responsible-AI statement, security methodology, and a sample incident.
"""
from __future__ import annotations

import io
from datetime import datetime, timedelta, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle)

from sqlalchemy.orm import Session

from app.models import Incident, ProtectedRequest, Verdict
from app.services.analytics_service import build_analytics, latest_evaluation
from app.services.settings_service import get_settings_dict
from app.security.taxonomy import ATTACK_TYPE_LABELS

RESPONSIBLE_AI_STATEMENT = (
    "Prohori AI is an AI-assisted security layer, not a perfect one. It can make mistakes in both "
    "directions: it may block legitimate requests (false positives) or miss novel attacks (false "
    "negatives). Confidence scores express model certainty, not ground truth. Decisions below the "
    "configured auto-block threshold are flagged for human review, and human review should remain "
    "part of any production deployment. Long-term attack memory stores only anonymized, summarized "
    "attack patterns — never raw customer prompts — and no customer data is used to train models. "
    "This system does not claim perfect protection; it claims explainable, auditable, improvable protection."
)

METHODOLOGY = (
    "Every request passes a fast Triage classification. Safe, high-confidence traffic is allowed "
    "immediately (the cost-aware fast lane). Anything ambiguous escalates to a structured debate: a "
    "Prosecutor agent argues the prompt is malicious, a Defender agent argues the strongest benign "
    "interpretation (both grounded in retrieved attack-pattern memory via RAG, plus an optional ML "
    "signal), and a Judge agent independently renders ALLOW, BLOCK, or REDACT with a confidence score "
    "and a plain-English rationale. Complete transcripts are persisted for audit."
)


def build_report(db: Session, days: int = 30) -> dict:
    now = datetime.now(timezone.utc)
    analytics = build_analytics(db, days=min(days, 90))

    sample = (db.query(Verdict, ProtectedRequest)
              .join(ProtectedRequest, Verdict.request_id == ProtectedRequest.id)
              .filter(Verdict.verdict.in_(["BLOCK", "REDACT"]))
              .order_by(Verdict.confidence.desc())
              .first())
    sample_incident = None
    if sample:
        v, req = sample
        sample_incident = {
            "request_id": req.id, "prompt_excerpt": req.prompt[:220],
            "verdict": v.verdict, "confidence": v.confidence, "risk_level": v.risk_level,
            "attack_types": v.attack_types, "reason": v.reason,
            "evidence": (v.evidence or [])[:4], "final_action": req.final_action,
            "llm_called": req.llm_called,
        }

    evaluation = latest_evaluation(db)
    period_start = (now - timedelta(days=days)).date().isoformat()
    return {
        "report_title": "Prohori AI — Responsible AI & Security Audit",
        "generated_at": now.isoformat(),
        "reporting_period": {"from": period_start, "to": now.date().isoformat(), "days": days},
        "summary": analytics["cards"],
        "verdict_distribution": analytics["verdict_distribution"],
        "attack_categories": [
            {"type": a["type"], "label": ATTACK_TYPE_LABELS.get(a["type"], a["type"]), "count": a["count"]}
            for a in analytics["attack_categories"]],
        "top_attack_patterns": analytics["top_attack_patterns"],
        "agent_latency_ms": analytics["agent_latency"],
        "evaluation_metrics": evaluation,
        "responsible_ai_statement": RESPONSIBLE_AI_STATEMENT,
        "security_methodology": METHODOLOGY,
        "sample_incident": sample_incident,
        "configuration": get_settings_dict(db),
    }


def render_pdf(report: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=16 * mm,
                            leftMargin=16 * mm, rightMargin=16 * mm,
                            title="Prohori AI — Security Audit Report")
    styles = getSampleStyleSheet()
    brand = ParagraphStyle("brand", parent=styles["Title"], textColor=colors.HexColor("#4f46e5"), fontSize=20)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=colors.HexColor("#312e81"),
                        spaceBefore=10, spaceAfter=4, fontSize=13)
    body = ParagraphStyle("body", parent=styles["BodyText"], fontSize=9, leading=12.5)
    small = ParagraphStyle("small", parent=styles["BodyText"], fontSize=8, leading=10.5,
                           textColor=colors.HexColor("#374151"))
    table_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#312e81")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c7d2fe")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#eef2ff")]),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ])
    story = []

    period = report["reporting_period"]
    story.append(Paragraph("Prohori AI — Responsible AI &amp; Security Audit", brand))
    story.append(Paragraph(f"Reporting period: {period['from']} → {period['to']} ({period['days']} days) · "
                           f"Generated {report['generated_at'][:19]}Z", small))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#4f46e5"), thickness=1.2))
    story.append(Spacer(1, 8))

    s = report["summary"]
    story.append(Paragraph("1. Security Posture Summary", h2))
    story.append(Table([
        ["Metric", "Value", "Metric", "Value"],
        ["Total requests", s["total_requests"], "Blocked", s["blocked"]],
        ["Allowed", s["allowed"], "Redacted", s["redacted"]],
        ["High risk", s["high_risk"], "Flagged for review", s["flagged_for_review"]],
        ["Debate escalation rate", f"{s['debate_rate'] * 100:.1f}%", "Avg decision time",
         f"{s['avg_decision_time_ms']:.0f} ms"],
        ["Fast-lane avg time", f"{s['avg_fastlane_time_ms']:.0f} ms", "Attack detection rate",
         f"{s['attack_detection_rate'] * 100:.1f}%"],
    ], style=table_style, hAlign="LEFT"))

    story.append(Paragraph("2. Attack Categories Detected", h2))
    cats = report["attack_categories"]
    if cats:
        story.append(Table([["Category", "Count"]] +
                           [[c["label"], c["count"]] for c in cats[:10]], style=table_style, hAlign="LEFT"))
    else:
        story.append(Paragraph("No attack categories recorded in this period.", body))

    story.append(Paragraph("3. Top Attack Patterns (from debate memory matches)", h2))
    pats = report["top_attack_patterns"]
    if pats:
        story.append(Table([["Pattern", "Matches"]] + [[p["pattern"], p["count"]] for p in pats],
                           style=table_style, hAlign="LEFT"))
    else:
        story.append(Paragraph("No strong memory matches recorded in this period.", body))

    story.append(Paragraph("4. Agent Latency (ms, average)", h2))
    lat = report["agent_latency_ms"] or {}
    if lat:
        story.append(Table([["Agent", "Avg ms"]] + [[k, v] for k, v in sorted(lat.items())],
                           style=table_style, hAlign="LEFT"))
    else:
        story.append(Paragraph("No debate data recorded yet.", body))

    story.append(Paragraph("5. Evaluation Metrics", h2))
    ev = report["evaluation_metrics"]
    if ev and ev.get("pipeline"):
        p, b = ev["pipeline"], ev.get("baseline", {})
        story.append(Paragraph(
            f"Pipeline (Triage + Multi-Agent Debate): accuracy {p['accuracy'] * 100:.1f}%, "
            f"precision {p['precision'] * 100:.1f}%, recall {p['recall'] * 100:.1f}%, "
            f"F1 {p['f1'] * 100:.1f}%, FPR {p['false_positive_rate'] * 100:.1f}%, "
            f"FNR {p['false_negative_rate'] * 100:.1f}%. "
            f"Baseline (ML classifier only): accuracy {b.get('accuracy', 0) * 100:.1f}%, "
            f"F1 {b.get('f1', 0) * 100:.1f}%. Sample: {ev.get('sample_size')} prompts "
            f"(held-out split, {ev.get('dataset_version', 'attack-dataset v1')}).", body))
    else:
        story.append(Paragraph("Evaluation pending — no evaluation has been run against the local "
                               "dataset yet. Run POST /api/v1/evaluate or use the Reports page.", body))

    story.append(Paragraph("6. Sample Incident", h2))
    si = report["sample_incident"]
    if si:
        story.append(Paragraph(
            f"Request {si['request_id'][:8]}… — verdict <b>{si['verdict']}</b> at "
            f"{si['confidence'] * 100:.0f}% confidence ({si['risk_level']} risk). "
            f"Categories: {', '.join(si['attack_types'])}. Forwarded to protected LLM: "
            f"{'yes' if si['llm_called'] else 'NO — original prompt was not forwarded'}.", body))
        story.append(Paragraph(f"Rationale: {si['reason']}", body))
    else:
        story.append(Paragraph("No blocked incidents in this period.", body))

    story.append(Paragraph("7. Security Methodology", h2))
    story.append(Paragraph(report["security_methodology"], body))

    story.append(Paragraph("8. Responsible AI Statement", h2))
    story.append(Paragraph(report["responsible_ai_statement"], body))

    doc.build(story)
    return buf.getvalue()
