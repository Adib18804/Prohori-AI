import { Shield, Gavel, Scale, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface DebateTimelineProps {
  triage: any;
  prosecutor?: any;
  defender?: any;
  verdict: any;
  ragMatches?: number;
}

export function DebateTimeline({ triage, prosecutor, defender, verdict, ragMatches = 0 }: DebateTimelineProps) {
  const getVerdictColor = (v: string) => {
    switch (v) {
      case 'ALLOW':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'BLOCK':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'REDACT':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Triage */}
      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 bg-card border border-border rounded-lg p-4 debate-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Triage Agent</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                triage.classification === 'SAFE' 
                  ? 'bg-green-500/20 text-green-400' 
                  : triage.classification === 'HIGH_RISK'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {triage.classification}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{triage.reason}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Risk: {(triage.risk_score * 100).toFixed(0)}%</span>
              <span>Confidence: {(triage.confidence * 100).toFixed(0)}%</span>
              {triage.processing_time_ms && <span>{triage.processing_time_ms}ms</span>}
            </div>
            {triage.attack_types && triage.attack_types.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {triage.attack_types.map((type: string) => (
                  <span key={type} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {type.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {(prosecutor || defender) && <div className="absolute left-5 top-12 w-0.5 h-8 bg-border" />}
      </div>

      {/* RAG Matches */}
      {ragMatches > 0 && (
        <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                <span className="text-purple-400 text-sm font-bold">{ragMatches}</span>
              </div>
            </div>
            <div className="flex-1 bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-1">Attack Memory</h3>
              <p className="text-sm text-muted-foreground">
                Found {ragMatches} similar attack pattern{ragMatches !== 1 ? 's' : ''} in memory
              </p>
            </div>
          </div>
          {prosecutor && <div className="absolute left-5 top-12 w-0.5 h-8 bg-border" />}
        </div>
      )}

      {/* Prosecutor */}
      {prosecutor && (
        <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                <Gavel className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div className="flex-1 bg-card border border-red-500/20 rounded-lg p-4 debate-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-red-400">Prosecutor Agent</h3>
                <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
                  {prosecutor.position}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{prosecutor.reasoning}</p>
              {prosecutor.evidence && prosecutor.evidence.length > 0 && (
                <div className="space-y-1 mb-2">
                  {prosecutor.evidence.slice(0, 3).map((e: string, i: number) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Risk: {(prosecutor.risk_score * 100).toFixed(0)}%</span>
                <span>Confidence: {(prosecutor.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          {defender && <div className="absolute left-5 top-12 w-0.5 h-8 bg-border" />}
        </div>
      )}

      {/* Defender */}
      {defender && (
        <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <Scale className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="flex-1 bg-card border border-green-500/20 rounded-lg p-4 debate-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-400">Defender Agent</h3>
                <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                  {defender.position}
                </span>
              </div>
              {defender.benign_interpretation && (
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">Benign Interpretation:</span> {defender.benign_interpretation}
                </p>
              )}
              <p className="text-sm text-muted-foreground mb-2">{defender.reasoning}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Risk: {(defender.risk_score * 100).toFixed(0)}%</span>
                <span>Confidence: {(defender.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          <div className="absolute left-5 top-12 w-0.5 h-8 bg-border" />
        </div>
      )}

      {/* Judge Verdict */}
      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
              verdict.verdict === 'ALLOW' 
                ? 'bg-green-500/20 border-green-500' 
                : verdict.verdict === 'BLOCK'
                ? 'bg-red-500/20 border-red-500'
                : 'bg-yellow-500/20 border-yellow-500'
            }`}>
              {verdict.verdict === 'ALLOW' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : verdict.verdict === 'BLOCK' ? (
                <XCircle className="w-5 h-5 text-red-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
            </div>
          </div>
          <div className={`flex-1 border rounded-lg p-4 debate-card ${getVerdictColor(verdict.verdict)}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Judge Agent — Verdict</h3>
              <span className="text-lg font-bold">{verdict.verdict}</span>
            </div>
            <p className="text-sm mb-2">{verdict.reason}</p>
            {verdict.evidence && verdict.evidence.length > 0 && (
              <div className="space-y-1 mb-2">
                {verdict.evidence.slice(0, 2).map((e: string, i: number) => (
                  <div key={i} className="text-xs flex items-start gap-2">
                    <span>•</span>
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-xs pt-2 border-t border-current/20">
              <span>Confidence: {(verdict.confidence * 100).toFixed(1)}%</span>
              <span>Risk: {verdict.risk_level}</span>
              {verdict.prosecutor_influence && (
                <span>Prosecutor: {(verdict.prosecutor_influence * 100).toFixed(0)}%</span>
              )}
              {verdict.defender_influence && (
                <span>Defender: {(verdict.defender_influence * 100).toFixed(0)}%</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}