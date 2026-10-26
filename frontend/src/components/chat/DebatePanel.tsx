import { Shield, CheckCircle, XCircle, Scale } from 'lucide-react';

interface DebateData {
  triage?: {
    classification: string;
    risk_score: number;
    confidence?: number;
  };
  prosecutor?: {
    position: string;
    risk_score: number;
    reasoning: string;
  };
  defender?: {
    position: string;
    risk_score: number;
    reasoning: string;
  };
  verdict?: {
    verdict: string;
    confidence: number;
    reason: string;
  };
}

interface DebatePanelProps {
  debate: DebateData | null;
  isVisible: boolean;
}

export default function DebatePanel({ debate, isVisible }: DebatePanelProps) {
  if (!isVisible) return null;

  if (!debate) {
    return (
      <div className="w-full border-l border-[#2A2A38] bg-[#12121A] p-4 md:w-80 md:p-5 xl:w-96 xl:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10B981]/20 to-[#3B82F6]/20 border border-[#10B981]/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#E8E8F0]">Security Analysis</h3>
            <p className="text-xs text-[#8B8B9E]">Real-time threat detection</p>
          </div>
        </div>

        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#10B981] mb-1">All Clear</p>
          <p className="text-xs text-[#8B8B9E]">
            No security threats detected in this conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-l border-[#2A2A38] bg-[#12121A] md:w-80 xl:w-96 overflow-y-auto">
      <div className="p-6 border-b border-[#2A2A38] sticky top-0 bg-[#12121A] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B]/20 to-[#EF4444]/20 border border-[#F59E0B]/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#E8E8F0]">Active Debate</h3>
            <p className="text-xs text-[#8B8B9E]">Multi-agent analysis</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Triage */}
        {debate.triage && (
          <div className="bg-[#1A1A24] border border-[#2A2A38] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#3B82F6]" />
              <h4 className="text-sm font-semibold text-[#E8E8F0]">Triage Agent</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8B8B9E]">Classification</span>
                <span className={`font-medium ${
                  debate.triage.classification === 'SAFE' ? 'text-[#10B981]' :
                  debate.triage.classification === 'SUSPICIOUS' ? 'text-[#F59E0B]' :
                  'text-[#EF4444]'
                }`}>
                  {debate.triage.classification}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8B8B9E]">Confidence</span>
                <span className="font-medium text-[#E8E8F0]">
                  {((debate.triage.confidence ?? debate.triage.risk_score) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#0D0D14]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] transition-all" style={{ width: `${Math.min(100, Math.max(0, (debate.triage.confidence ?? debate.triage.risk_score) * 100))}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Prosecutor */}
        {debate.prosecutor && (
          <div className="bg-[#1A1A24] border border-[#EF4444]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-[#EF4444]" />
              <h4 className="text-sm font-semibold text-[#EF4444]">Prosecutor</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#8B8B9E]">Position</span>
                <span className="font-medium text-[#EF4444]">{debate.prosecutor.position}</span>
              </div>
              <p className="text-xs text-[#8B8B9E] leading-relaxed">
                {debate.prosecutor.reasoning}
              </p>
            </div>
          </div>
        )}

        {/* Defender */}
        {debate.defender && (
          <div className="bg-[#1A1A24] border border-[#10B981]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              <h4 className="text-sm font-semibold text-[#10B981]">Defender</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#8B8B9E]">Position</span>
                <span className="font-medium text-[#10B981]">{debate.defender.position}</span>
              </div>
              <p className="text-xs text-[#8B8B9E] leading-relaxed">
                {debate.defender.reasoning}
              </p>
            </div>
          </div>
        )}

        {/* Final Verdict */}
        {debate.verdict && (
          <div className="bg-[#1A1A24] border border-[#7C3AED]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-[#7C3AED]" />
              <h4 className="text-sm font-semibold text-[#7C3AED]">Final Verdict</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#8B8B9E]">Decision</span>
                <span className={`font-medium ${
                  debate.verdict.verdict === 'ALLOW' ? 'text-[#10B981]' :
                  debate.verdict.verdict === 'REDACT' ? 'text-[#F59E0B]' :
                  'text-[#EF4444]'
                }`}>
                  {debate.verdict.verdict}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#0D0D14]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#D946EF] transition-all" style={{ width: `${Math.min(100, Math.max(0, debate.verdict.confidence * 100))}%` }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8B8B9E]">Confidence</span>
                <span className="font-medium text-[#E8E8F0]">
                  {(debate.verdict.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-[#8B8B9E] leading-relaxed">
                {debate.verdict.reason}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
