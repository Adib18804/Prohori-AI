import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerdictRevealProps {
  verdict: 'ALLOW' | 'BLOCK' | 'REDACT';
  confidence: number;
  riskLevel: string;
  reason: string;
  evidence?: string[];
  debateId?: string | null;
}

export function VerdictReveal({ verdict, confidence, riskLevel, reason, evidence = [], debateId }: VerdictRevealProps) {
  const palette =
    verdict === 'ALLOW'
      ? { text: 'text-success', bg: 'bg-success/10', border: 'border-success/40', shadow: 'shadow-[0_0_40px_-8px_rgba(16,185,129,0.5)]', pulse: 'bg-success' }
      : verdict === 'BLOCK'
      ? { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/40', shadow: 'shadow-[0_0_40px_-8px_rgba(239,68,68,0.5)]', pulse: 'bg-danger' }
      : { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/40', shadow: 'shadow-[0_0_40px_-8px_rgba(245,158,11,0.5)]', pulse: 'bg-warning' };

  const Icon = verdict === 'ALLOW' ? CheckCircle : verdict === 'BLOCK' ? XCircle : AlertTriangle;
  const pct = Math.round(confidence * 100);

  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => `${v.toFixed(1)}%`);

  useEffect(() => {
    const controls = animate(mv, pct, { duration: 0.8, ease: 'easeOut', delay: 0.4 });
    return () => controls.stop;
  }, [pct, mv]);

  return (
    <div className="relative">
      {/* screen-wide flash */}
      <motion.div
        className={cn('fixed inset-0 pointer-events-none', palette.pulse)}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.07, 0] }}
        transition={{ duration: 0.6, delay: 0.15 }}
      />
      {/* expanding pulse ring */}
      <motion.div
        className={cn('absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none', palette.pulse)}
        initial={{ width: 0, height: 0, opacity: 0.4 }}
        animate={{ width: 320, height: 320, opacity: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
        whileHover={{ y: -2 }}
        className={cn('rounded-2xl border p-5 backdrop-blur', palette.bg, palette.border, palette.shadow)}
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.2, 1] }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={cn('w-10 h-10 rounded-full border flex items-center justify-center', palette.bg, palette.border, palette.text)}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Final Verdict</p>
            <p className={cn('text-xl font-bold tracking-tight', palette.text)}>
              {verdict === 'ALLOW' ? 'ALLOWED' : verdict === 'BLOCK' ? 'BLOCKED' : 'REDACTED'}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-muted-foreground">Confidence</span>
            <span className={palette.text}><motion.span>{display}</motion.span></span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', palette.pulse)}
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            />
          </div>
        </div>

        <p className="text-sm leading-relaxed">{reason}</p>

        {evidence.length > 0 && (
          <ul className="mt-3 space-y-1">
            {evidence.slice(0, 2).map((e, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className={palette.text}>▸</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 pt-3 border-t border-current/15 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>RISK {riskLevel}</span>
          {debateId && (
            <a href={`/debates/${debateId}`} className={cn('hover:underline', palette.text)}>
              View Full Reasoning Transcript →
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}
