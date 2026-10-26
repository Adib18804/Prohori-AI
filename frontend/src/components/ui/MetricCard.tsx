import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
  delay?: number;
}

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  className,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'card-hover rounded-xl bg-surface border border-border p-5 shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg bg-current/10', iconColor)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.positive ? 'text-success' : 'text-danger'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/70 mt-1">{sub}</div>}
    </motion.div>
  );
}

export function StatRow({
  label,
  value,
  bar,
  barColor = 'bg-primary',
}: {
  label: string;
  value: ReactNode;
  bar?: number;
  barColor?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      {bar !== undefined && (
        <div className="w-full bg-surface-2 rounded-full h-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.max(bar, 0), 100)}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={cn('h-1.5 rounded-full', barColor)}
          />
        </div>
      )}
    </div>
  );
}
