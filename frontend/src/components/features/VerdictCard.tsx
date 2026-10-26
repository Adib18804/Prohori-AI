import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { ProtectResponse } from '@/services/api';

export function VerdictCard({
  verdict,
  compact = false,
  onViewDebate,
}: {
  verdict: ProtectResponse;
  compact?: boolean;
  onViewDebate?: () => void;
}) {
  const style =
    verdict.verdict === 'ALLOW'
      ? { cls: 'verdict-allow', Icon: CheckCircle }
      : verdict.verdict === 'BLOCK'
      ? { cls: 'verdict-block', Icon: XCircle }
      : { cls: 'verdict-redact', Icon: AlertTriangle };

  return (
    <div className={cn('rounded-xl border p-4', style.cls)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <style.Icon className="w-5 h-5" />
          <span className="font-bold font-mono text-base tracking-tight">{verdict.verdict}</span>
          <span className="text-xs opacity-80 font-mono">{(verdict.confidence * 100).toFixed(1)}%</span>
        </div>
        {onViewDebate && verdict.debate_triggered && (
          <button
            onClick={onViewDebate}
            className="text-xs font-medium underline underline-offset-4 hover:opacity-80 transition"
          >
            View Debate
          </button>
        )}
      </div>

      {!compact && (
        <>
          <p className="text-sm mt-2 opacity-90">{verdict.reason}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="border-current/30">{verdict.risk_level}</Badge>
            <span className="text-xs font-mono opacity-70">{verdict.processing_time_ms}ms</span>
            {verdict.attack_types.map((t) => (
              <Badge key={t} variant="danger">{t.replace(/_/g, ' ')}</Badge>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
