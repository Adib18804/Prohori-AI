import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BadgeCheck, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AgentCard, AgentTypewriter } from './AgentCard';
import { StatusBar, ArenaPhase } from './StatusBar';
import { VerdictReveal } from './VerdictReveal';
import { CourtroomBackground } from './CourtroomBackground';
import { TypewriterText } from '@/components/features/TypewriterText';

export interface DebateArenaData {
  prompt: string;
  triage: {
    classification: string;
    risk_score: number;
    confidence: number;
    reason: string;
    attack_types?: string[];
    processing_time_ms?: number;
  } | null;
  prosecutor: {
    position: string;
    risk_score: number;
    confidence: number;
    reasoning: string;
    evidence?: string[];
  } | null;
  defender: {
    position: string;
    risk_score: number;
    confidence: number;
    reasoning: string;
    benign_interpretation?: string;
  } | null;
  verdict: {
    verdict: 'ALLOW' | 'BLOCK' | 'REDACT';
    confidence: number;
    risk_level: string;
    reason: string;
    evidence?: string[];
  };
  ragMatches?: number;
  debateId?: string | null;
  animate?: boolean;
}

const T = 1600; // stage 1 hold
const D = 3400; // stage 2 hold

export function DebateArena({ triage, prosecutor, defender, verdict, ragMatches = 0, debateId, animate = true }: DebateArenaData) {
  const hasDebate = !!(prosecutor && defender);
  const [phase, setPhase] = useState<ArenaPhase | 'done'>(animate ? 'triage' : 'done');
  const [typingTriage, setTypingTriage] = useState(animate);
  const [typingDebate, setTypingDebate] = useState(animate);

  useEffect(() => {
    if (!animate) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (hasDebate) {
      timers.push(setTimeout(() => setPhase('debate'), T));
      timers.push(setTimeout(() => setPhase('judge'), D));
      timers.push(setTimeout(() => setPhase('verdict'), D + 1600));
    } else {
      timers.push(setTimeout(() => setPhase('judge'), T));
      timers.push(setTimeout(() => setPhase('verdict'), T + 1400));
    }
    return () => timers.forEach(clearTimeout);
  }, [animate, hasDebate]);

  useEffect(() => {
    const id = setTimeout(() => setTypingTriage(false), T);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (phase !== 'debate') return;
    const id = setTimeout(() => setTypingDebate(false), 2400);
    return () => clearTimeout(id);
  }, [phase]);

  const verdictBody = (typing: boolean) =>
    typing ? (
      <TypewriterText text={verdict.reason} className="text-sm leading-relaxed text-muted-foreground" />
    ) : (
      <p className="text-sm leading-relaxed text-muted-foreground">{verdict.reason}</p>
    );
  return (
    <div className="relative space-y-4">
      <CourtroomBackground />
      <div className="relative space-y-4">
        <StatusBar phase={phase} hasDebate={hasDebate} />

        {ragMatches > 0 && (
          <div className="flex items-center gap-2 text-xs text-accent font-mono">
            <BadgeCheck className="w-4 h-4" />
            {ragMatches} similar attack pattern{ragMatches !== 1 ? 's' : ''} matched from memory
          </div>
        )}

        {/* STAGE 1: Triage */}
        {triage && (
          <AgentCard
            role="triage"
            title="Triage Agent"
            thinking="Classifying prompt…"
            active={phase === 'triage'}
            done={phase !== 'triage'}
            badge={
              <Badge variant={triage.classification === 'SAFE' ? 'success' : triage.classification === 'HIGH_RISK' ? 'danger' : 'warning'}>
                {triage.classification}
              </Badge>
            }
          >
            {phase === 'triage' && typingTriage ? (
              <TypewriterText text={triage.reason} className="text-sm text-muted-foreground" />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{triage.reason}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span>RISK {(triage.risk_score * 100).toFixed(0)}%</span>
                  <span>CONF {(triage.confidence * 100).toFixed(0)}%</span>
                  {triage.processing_time_ms != null && <span>{triage.processing_time_ms}ms</span>}
                </div>
                {triage.attack_types?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {triage.attack_types.map((t) => (
                      <Badge key={t} variant="danger">{t.replace(/_/g, ' ')}</Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </AgentCard>
        )}

        {/* STAGE 2: VS battle */}
        <AnimatePresence>
          {hasDebate && (phase === 'debate' || phase === 'judge' || phase === 'verdict' || phase === 'done') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <AgentCard
                role="prosecutor"
                title="Prosecutor Agent"
                thinking="Building the case…"
                active={phase === 'debate'}
                done={phase !== 'debate'}
                slideFrom="left"
                badge={<Badge variant="danger">{prosecutor!.position}</Badge>}
              >
                {phase === 'debate' && typingDebate ? (
                  <AgentTypewriter text={prosecutor!.reasoning} className="text-sm text-muted-foreground" />
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{prosecutor!.reasoning}</p>
                    {prosecutor!.evidence?.length > 0 && (
                      <ul className="space-y-1">
                        {prosecutor!.evidence.slice(0, 3).map((e, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-agent-prosecutor">▸</span>
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="text-xs text-muted-foreground font-mono">
                      RISK {(prosecutor!.risk_score * 100).toFixed(0)}% · CONF {(prosecutor!.confidence * 100).toFixed(0)}%
                    </div>
                  </>
                )}
              </AgentCard>

              <motion.div
                className="flex items-center justify-center py-1"
                animate={{ scale: phase === 'debate' ? [1, 1.25, 1, 1.25, 1, 1.25, 1] : 1 }}
                transition={{ duration: 1.4, times: [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84] }}
              >
                <span className="flex items-center gap-1.5 text-xs font-bold font-mono tracking-widest text-accent">
                  <Zap className="w-3.5 h-3.5" /> VS <Zap className="w-3.5 h-3.5" />
                </span>
              </motion.div>

              <AgentCard
                role="defender"
                title="Defender Agent"
                thinking="Finding counter-arguments…"
                active={phase === 'debate'}
                done={phase !== 'debate'}
                slideFrom="right"
                badge={<Badge variant="success">{defender!.position}</Badge>}
              >
                {phase === 'debate' && typingDebate ? (
                  <AgentTypewriter text={defender!.reasoning} className="text-sm text-muted-foreground" />
                ) : (
                  <>
                    {defender!.benign_interpretation && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Benign read: </span>
                        {defender!.benign_interpretation}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">{defender!.reasoning}</p>
                    <div className="text-xs text-muted-foreground font-mono">
                      RISK {(defender!.risk_score * 100).toFixed(0)}% · CONF {(defender!.confidence * 100).toFixed(0)}%
                    </div>
                  </>
                )}
              </AgentCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 3: Judge */}
        {phase !== 'triage' && phase !== 'debate' && (
          <AgentCard
            role="judge"
            title="Judge Agent — weighing both sides"
            thinking="Weighing both sides…"
            active={phase === 'judge'}
            done={phase === 'verdict' || phase === 'done'}
            badge={<FileText className="w-3.5 h-3.5 text-muted-foreground" />}
          >
            {phase === 'judge' ? (
              <TypewriterText text={verdict.reason} className="text-sm text-muted-foreground" maxDurationMs={1400} />
            ) : (
              verdictBody(false)
            )}
          </AgentCard>
        )}

        {/* VERDICT REVEAL */}
        <AnimatePresence>
          {(phase === 'verdict' || phase === 'done' || !animate) && (
            <VerdictReveal
              verdict={verdict.verdict}
              confidence={verdict.confidence}
              riskLevel={verdict.risk_level}
              reason={verdict.reason}
              evidence={verdict.evidence}
              debateId={debateId}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
