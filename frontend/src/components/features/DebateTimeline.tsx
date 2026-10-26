import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AgentAvatar } from './AgentAvatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface DebateTimelineProps {
  triage: any;
  prosecutor?: any;
  defender?: any;
  verdict: any;
  ragMatches?: number;
}

const stage = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
};

function MetricsRow({ risk, confidence, extra }: { risk?: number; confidence?: number; extra?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
      {risk !== undefined && <span>RISK {(risk * 100).toFixed(0)}%</span>}
      {confidence !== undefined && <span>CONF {(confidence * 100).toFixed(0)}%</span>}
      {extra && <span>{extra}</span>}
    </div>
  );
}

export function DebateTimeline({ triage, prosecutor, defender, verdict, ragMatches = 0 }: DebateTimelineProps) {
  const verdictStyle =
    verdict?.verdict === 'ALLOW'
      ? 'verdict-allow'
      : verdict?.verdict === 'BLOCK'
      ? 'verdict-block'
      : 'verdict-redact';

  const VerdictIcon =
    verdict?.verdict === 'ALLOW' ? CheckCircle : verdict?.verdict === 'BLOCK' ? XCircle : AlertTriangle;

  let idx = 0;
  const nextDelay = () => ({ ...stage, transition: { ...stage.transition, delay: idx++ * 0.15 } });

  return (
    <div className="relative space-y-4 pl-2">
      {triage && (
        <motion.div {...nextDelay()} className="flex gap-3">
          <AgentAvatar role="triage" />
          <div className="flex-1 rounded-xl bg-surface border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-agent-triage">Triage Agent</span>
              <Badge
                variant={
                  triage.classification === 'SAFE'
                    ? 'success'
                    : triage.classification === 'HIGH_RISK'
                    ? 'danger'
                    : 'warning'
                }
              >
                {triage.classification}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{triage.reason}</p>
            <MetricsRow risk={triage.risk_score} confidence={triage.confidence} extra={triage.processing_time_ms ? `${triage.processing_time_ms}ms` : undefined} />
            {triage.attack_types?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {triage.attack_types.map((t: string) => (
                  <Badge key={t} variant="danger">{t.replace(/_/g, ' ')}</Badge>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {ragMatches > 0 && (
        <motion.div {...nextDelay()} className="flex gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-accent text-xs font-bold font-mono">
            {ragMatches}
          </div>
          <div className="flex-1 rounded-xl bg-surface border border-accent/20 p-4">
            <span className="font-semibold text-accent">Attack Memory</span>
            <p className="text-sm text-muted-foreground mt-1">
              {ragMatches} similar attack pattern{ragMatches !== 1 ? 's' : ''} matched
            </p>
          </div>
        </motion.div>
      )}

      {prosecutor && (
        <motion.div {...nextDelay()} className="flex gap-3">
          <AgentAvatar role="prosecutor" />
          <div className="flex-1 rounded-xl bg-surface border border-agent-prosecutor/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-agent-prosecutor">Prosecutor Agent</span>
              <Badge variant="danger">{prosecutor.position}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{prosecutor.reasoning}</p>
            {prosecutor.evidence?.length > 0 && (
              <ul className="space-y-1 mb-2">
                {prosecutor.evidence.slice(0, 3).map((e: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-agent-prosecutor">▸</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            )}
            <MetricsRow risk={prosecutor.risk_score} confidence={prosecutor.confidence} />
          </div>
        </motion.div>
      )}

      {defender && (
        <motion.div {...nextDelay()} className="flex gap-3">
          <AgentAvatar role="defender" />
          <div className="flex-1 rounded-xl bg-surface border border-agent-defender/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-agent-defender">Defender Agent</span>
              <Badge variant="success">{defender.position}</Badge>
            </div>
            {defender.benign_interpretation && (
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium text-foreground">Benign read: </span>
                {defender.benign_interpretation}
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-2">{defender.reasoning}</p>
            <MetricsRow risk={defender.risk_score} confidence={defender.confidence} />
          </div>
        </motion.div>
      )}

      {verdict && (
        <motion.div {...nextDelay()} className="flex gap-3">
          <div
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-full border',
              verdict.verdict === 'ALLOW'
                ? 'bg-success/15 border-success/40 text-success'
                : verdict.verdict === 'BLOCK'
                ? 'bg-danger/15 border-danger/40 text-danger'
                : 'bg-warning/15 border-warning/40 text-warning'
            )}
          >
            <VerdictIcon className="w-[18px] h-[18px]" />
          </div>
          <div className={cn('flex-1 rounded-xl border p-4', verdictStyle)}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Judge Agent — Final Verdict</span>
              <span className="text-lg font-bold font-mono tracking-tight">{verdict.verdict}</span>
            </div>
            <p className="text-sm mb-2">{verdict.reason}</p>
            {verdict.evidence?.length > 0 && (
              <ul className="space-y-1 mb-2">
                {verdict.evidence.slice(0, 2).map((e: string, i: number) => (
                  <li key={i} className="text-xs opacity-80 flex gap-2">
                    <span>▸</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-3 text-xs font-mono pt-2 border-t border-current/20 opacity-80">
              <span>CONF {(verdict.confidence * 100).toFixed(1)}%</span>
              <span>RISK {verdict.risk_level}</span>
              {verdict.prosecutor_influence !== undefined && (
                <span>PROS {(verdict.prosecutor_influence * 100).toFixed(0)}%</span>
              )}
              {verdict.defender_influence !== undefined && (
                <span>DEF {(verdict.defender_influence * 100).toFixed(0)}%</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
