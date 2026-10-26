import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const severityVariant: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

const statusColor: Record<string, string> = {
  detected: 'text-warning',
  investigating: 'text-info',
  confirmed: 'text-danger',
  false_positive: 'text-success',
  resolved: 'text-muted-foreground',
};

export function IncidentRow({
  incident,
  selected,
  onClick,
}: {
  incident: any;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'card-hover w-full text-left rounded-xl bg-surface border p-4 transition',
        selected ? 'border-primary/60 shadow-glow-sm' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-danger/10">
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <span className="font-semibold text-sm tracking-tight">
            {incident.incident_type.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
        <Badge variant={severityVariant[incident.severity] ?? 'default'}>
          {incident.severity}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <span className={cn('font-sans font-medium', statusColor[incident.status])}>
          {incident.status.replace(/_/g, ' ')}
        </span>
        <span>·</span>
        <span>{(incident.confidence * 100).toFixed(1)}% conf</span>
        <span>·</span>
        <span>{format(new Date(incident.created_at), 'MMM dd, HH:mm')}</span>
      </div>
    </button>
  );
}
