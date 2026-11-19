import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Scale, Loader2 } from 'lucide-react';

interface DebatePanelProps {
  /**
   * True while the backend is processing the 4‑agent debate.
   */
  isLoading: boolean;
  /** Verdict returned by the backend (e.g. "ALLOW", "BLOCK", "REDACT"). */
  verdict?: string;
  /** Risk classification from the triage step (e.g. "SAFE", "SUSPICIOUS", "MALICIOUS"). */
  riskLevel?: string;
  /** Optional human‑readable reason supplied by the backend. */
  reason?: string;
  /** Confidence score between 0 and 1. */
  confidence?: number;
}

/**
 * Animated security analysis panel used on the Chat page.
 *
 * - Shows a radar‑style loading animation while `isLoading` is true.
 * - After loading finishes it displays a verdict card with colour‑coded styling.
 * - The component is fully responsive: a fixed sidebar on desktop and a bottom‑sheet style
 *   panel on mobile (handled by the parent). No external packages are required beyond the
 *   already‑installed `framer-motion` and `lucide-react`.
 */
export default function DebatePanel({
  isLoading,
  verdict,
  riskLevel,
  reason,
  confidence,
}: DebatePanelProps) {
  // Control step‑by‑step messages during the loading animation.
  const steps = [
    '🛡️ Triage Agent: Scanning intent',
    '⚖️ Prosecutor Agent: Evaluating threat',
    '🛡️ Defender Agent: Counter‑analysis',
    '🏛️ Judge Agent: Rendering verdict',
  ];
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Helper to pick a colour based on the verdict.
  const verdictColor = verdict === 'ALLOW' ? 'text-[#10B981]' : verdict === 'REDACT' ? 'text-[#F59E0B]' : 'text-[#EF4444]';

  // Radar animation – three concentric circles that pulse.
  const Radar = () => (
    <div className="relative flex size-48 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute size-full rounded-full border border-[#3B82F6]/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4, ease: 'easeInOut' }}
        />
      ))}
      <motion.div
        className="size-8 rounded-full bg-[#3B82F6]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
      />
    </div>
  );

  return (
    <div className="w-full border-l border-[#2A2A38] bg-[#12121A] md:w-80 xl:w-96 overflow-y-auto p-4 md:p-5 xl:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10B981]/20 to-[#3B82F6]/20 border border-[#10B981]/30 flex items-center justify-center">
          <Shield className="w-6 h-6 text-[#10B981]" />
        </div>
        <div>
          <h3 className="font-semibold text-[#E8E8F0]">Security Analysis</h3>
          <p className="text-xs text-[#8B8B9E]">Real‑time threat detection</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <Radar />
          <p className="text-sm font-medium text-[#E8E8F0]">{steps[stepIndex]}</p>
          <Loader2 className="animate-spin text-[#3B82F6]" size={24} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Verdict Card */}
          {verdict && (
            <div className={`bg-[#1A1A24] border ${verdict === 'ALLOW' ? 'border-[#10B981]/30' : verdict === 'REDACT' ? 'border-[#F59E0B]/30' : 'border-[#EF4444]/30'} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                {verdict === 'ALLOW' && <CheckCircle className="w-5 h-5 text-[#10B981]" />}
                {verdict === 'BLOCK' && <XCircle className="w-5 h-5 text-[#EF4444]" />}
                {verdict === 'REDACT' && <Scale className="w-5 h-5 text-[#F59E0B]" />}
                <h4 className={`text-sm font-semibold ${verdictColor}`}>Final Verdict: {verdict}</h4>
              </div>
              {confidence !== undefined && (
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#8B8B9E]">Confidence</span>
                  <span className="font-medium text-[#E8E8F0]">{(confidence * 100).toFixed(0)}%</span>
                </div>
              )}
              {reason && (
                <p className="text-xs text-[#8B8B9E] leading-relaxed">
                  {reason}
                </p>
              )}
            </div>
          )}

          {/* Risk Level */}
          {riskLevel && (
            <div className="bg-[#1A1A24] border border-[#3B82F6]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-[#3B82F6]" />
                <h4 className="text-sm font-semibold text-[#3B82F6]">Risk Level</h4>
              </div>
              <p className="text-xs text-[#E8E8F0] capitalize">{riskLevel}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
