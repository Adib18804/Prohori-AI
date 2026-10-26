import { AlertTriangle, Eye } from 'lucide-react';

interface WarningCardProps {
  warningsCount: number;
  warningsLeft: number;
  reason: string;
  onViewReasoning?: () => void;
  onUnderstood: () => void;
}

export default function WarningCard({
  warningsCount,
  warningsLeft,
  reason,
  onViewReasoning,
  onUnderstood,
}: WarningCardProps) {
  return (
    <div className="bg-[#F59E0B]/10 border-2 border-[#F59E0B] rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-[#F59E0B]/20 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-[#F59E0B]">
              SECURITY WARNING {warningsCount}/3
            </h3>
            <span className="px-2 py-1 bg-[#F59E0B]/20 rounded text-xs font-medium text-[#F59E0B]">
              {warningsLeft} warning{warningsLeft !== 1 ? 's' : ''} left
            </span>
          </div>
          <p className="text-sm text-[#E8E8F0] mb-4 leading-relaxed">
            {reason || 'Your last message was flagged as potentially malicious. Continuing this behavior may result in account suspension.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {onViewReasoning && (
              <button
                onClick={onViewReasoning}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border border-[#F59E0B]/30 rounded-lg text-sm font-medium text-[#F59E0B] transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Reasoning
              </button>
            )}
            <button
              onClick={onUnderstood}
              className="px-4 py-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 rounded-lg text-sm font-medium text-white transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
