import { useEffect, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AgentAvatar } from '@/components/features/AgentAvatar';
import { TypewriterText } from '@/components/features/TypewriterText';
import { cn } from '@/lib/utils';

export interface AgentCardProps {
  role: 'triage' | 'prosecutor' | 'defender' | 'judge';
  title: string;
  thinking: string;
  active: boolean;
  done: boolean;
  badge?: ReactNode;
  children?: ReactNode;
  slideFrom?: 'left' | 'right';
}

export function AgentCard({ role, title, thinking, active, done, badge, children, slideFrom }: AgentCardProps) {
  const [thinkingDone, setThinkingDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setThinkingDone(true), 800);
    return () => clearTimeout(id);
  }, [active]);

  useEffect(() => {
    if (done) setThinkingDone(true);
  }, [done]);

  if (!active && !done) return null;

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: slideFrom === 'left' ? -40 : slideFrom === 'right' ? 40 : 0,
        y: slideFrom ? 0 : 16,
      }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="hover:-translate-y-0.5 transition-transform"
    >
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          <AgentAvatar role={role} className={active ? 'animate-pulse-glow' : ''} />
          {active && (
            <span className="absolute inset-0 rounded-full ring-2 ring-primary/50 animate-ping" />
          )}
        </div>
        <div
          className={cn(
            'flex-1 min-w-0 rounded-xl bg-surface border p-4',
            role === 'prosecutor' && 'border-agent-prosecutor/30 shadow-glow-sm',
            role === 'defender' && 'border-agent-defender/30 shadow-glow-sm',
            role === 'triage' && 'border-agent-triage/30',
            role === 'judge' && 'border-agent-judge/30'
          )}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={cn('font-semibold text-sm', `text-agent-${role}`, active && 'animate-pulse')}>
              {title}
            </span>
            {badge}
          </div>
          {active && !thinkingDone ? (
            <p className="text-sm text-muted-foreground typing-indicator">{thinking}</p>
          ) : active && !done ? (
            children
          ) : (
            <div className="space-y-2">{children}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AgentTypewriter({ text, className }: { text: string; className?: string }) {
  return <TypewriterText text={text} className={className} maxDurationMs={2500} />;
}
