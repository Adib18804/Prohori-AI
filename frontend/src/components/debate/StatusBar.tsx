import { useEffect, useState } from 'react';
import { Search, Swords, Shield, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ArenaPhase = 'triage' | 'debate' | 'judge' | 'verdict';

const ORDER: { key: ArenaPhase; agents: { role: string; label: string; icon: any; color: string }[] }[] = [
  { key: 'triage', agents: [{ role: 'triage', label: 'Triage', icon: Search, color: 'text-agent-triage' }] },
  {
    key: 'debate',
    agents: [
      { role: 'prosecutor', label: 'Prosecutor', icon: Swords, color: 'text-agent-prosecutor' },
      { role: 'defender', label: 'Defender', icon: Shield, color: 'text-agent-defender' },
    ],
  },
  { key: 'judge', agents: [{ role: 'judge', label: 'Judge', icon: Scale, color: 'text-agent-judge' }] },
];

export function StatusBar({ phase, hasDebate }: { phase: ArenaPhase | 'done'; hasDebate: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(id);
  }, []);

  const order = hasDebate ? ORDER : ORDER.filter((s) => s.key !== 'debate');
  const currentIndex = order.findIndex((s) => s.key === phase);
  const stageLabel =
    phase === 'verdict' || phase === 'done'
      ? 'Verdict delivered'
      : currentIndex >= 0
      ? `Live debate in progress — Stage ${currentIndex + 1} of ${order.length}`
      : 'Awaiting debate';

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {order.flatMap((stage) =>
            stage.agents.map((agent) => {
              const stageIdx = order.findIndex((s) => s.key === stage.key);
              const done = phase === 'done' || phase === 'verdict' || stageIdx < currentIndex;
              const active = stageIdx === currentIndex;
              return (
                <span
                  key={agent.role}
                  title={agent.label}
                  className={cn(
                    'relative flex w-6 h-6 items-center justify-center rounded-full border',
                    done && 'bg-surface-2 border-border',
                    active && 'border-current animate-pulse-glow',
                    !done && !active && 'border-border opacity-40',
                    agent.color
                  )}
                >
                  <agent.icon className="w-3.5 h-3.5" />
                  {active && (
                    <span className={cn('absolute inset-0 rounded-full ring-1 animate-ping', agent.color)} />
                  )}
                </span>
              );
            })
          )}
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">Elapsed {elapsed.toFixed(1)}s</span>
      </div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse-glow" />
        {stageLabel}
      </p>
    </div>
  );
}
