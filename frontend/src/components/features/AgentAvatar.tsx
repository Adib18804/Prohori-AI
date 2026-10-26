import { Search, Swords, Shield, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AgentRole = 'triage' | 'prosecutor' | 'defender' | 'judge';

const agentConfig: Record<
  AgentRole,
  { icon: typeof Shield; color: string; bg: string; label: string }
> = {
  triage: { icon: Search, color: 'text-agent-triage', bg: 'bg-agent-triage/15 border-agent-triage/40', label: 'Triage' },
  prosecutor: { icon: Swords, color: 'text-agent-prosecutor', bg: 'bg-agent-prosecutor/15 border-agent-prosecutor/40', label: 'Prosecutor' },
  defender: { icon: Shield, color: 'text-agent-defender', bg: 'bg-agent-defender/15 border-agent-defender/40', label: 'Defender' },
  judge: { icon: Scale, color: 'text-agent-judge', bg: 'bg-agent-judge/15 border-agent-judge/40', label: 'Judge' },
};

export function AgentAvatar({
  role,
  size = 'md',
  className,
}: {
  role: AgentRole;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const config = agentConfig[role];
  const Icon = config.icon;
  return (
    <div
      title={config.label}
      className={cn(
        'flex items-center justify-center rounded-full border',
        config.bg,
        config.color,
        size === 'md' ? 'w-9 h-9' : 'w-7 h-7',
        className
      )}
    >
      <Icon className={size === 'md' ? 'w-4.5 h-4.5 w-[18px] h-[18px]' : 'w-3.5 h-3.5'} />
    </div>
  );
}

export function AgentName({ role }: { role: AgentRole }) {
  return <span className={cn('font-semibold', agentConfig[role].color)}>{agentConfig[role].label} Agent</span>;
}
