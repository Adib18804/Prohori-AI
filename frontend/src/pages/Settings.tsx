import { useState } from 'react';
import { Shield, Sliders, Database, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-ring',
        enabled ? 'accent-gradient shadow-glow-sm' : 'bg-surface-2 border border-border',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-mono text-primary">{(value * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#7C3AED] cursor-pointer"
      />
      <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
    </div>
  );
}

export default function Settings() {
  const [autoBlockThreshold, setAutoBlockThreshold] = useState(0.9);
  const [debateThreshold, setDebateThreshold] = useState(0.7);
  const [enableRAG, setEnableRAG] = useState(true);
  const [enableML, setEnableML] = useState(false);

  const models = [
    { label: 'Triage Model', value: 'gpt-4o-mini' },
    { label: 'Prosecutor Model', value: 'gpt-4o' },
    { label: 'Defender Model', value: 'gpt-4o' },
    { label: 'Judge Model', value: 'gpt-4o' },
    { label: 'Embedding Model', value: 'text-embedding-3-small' },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure security thresholds and system behavior
          </p>
        </div>

        {/* Thresholds */}
        <div className="rounded-xl bg-surface border border-border p-5 mb-4 shadow-card">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold">Security Thresholds</h2>
          </div>
          <div className="space-y-6">
            <Slider
              label="Auto-Block Threshold"
              hint="Requests with confidence above this threshold are automatically blocked"
              value={autoBlockThreshold}
              min={0.5}
              max={1}
              step={0.05}
              onChange={setAutoBlockThreshold}
            />
            <Slider
              label="Debate Threshold"
              hint="Requests with risk above this threshold trigger full debate"
              value={debateThreshold}
              min={0.3}
              max={0.9}
              step={0.05}
              onChange={setDebateThreshold}
            />
          </div>
        </div>

        {/* Features */}
        <div className="rounded-xl bg-surface border border-border p-5 mb-4 shadow-card">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Sliders className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-sm font-semibold">Features</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  RAG Attack Memory
                  <Badge variant="accent">vector search</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Similarity search against known attack patterns
                </div>
              </div>
              <Toggle enabled={enableRAG} onChange={() => setEnableRAG(!enableRAG)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  ML Classifier
                  <Badge variant="warning">
                    <Sparkles className="w-3 h-3" /> experimental
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Additional machine learning risk scoring
                </div>
              </div>
              <Toggle enabled={enableML} onChange={() => setEnableML(!enableML)} disabled />
            </div>
          </div>
        </div>

        {/* Models */}
        <div className="rounded-xl bg-surface border border-border p-5 shadow-card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-lg bg-info/10 border border-info/20">
              <Database className="w-4 h-4 text-info" />
            </div>
            <h2 className="text-sm font-semibold">Model Configuration</h2>
          </div>
          <div className="space-y-2">
            {models.map((m) => (
              <div
                key={m.label}
                className="flex justify-between items-center text-sm rounded-lg bg-background/60 border border-border px-3.5 py-2.5"
              >
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-mono text-xs text-primary">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button>
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
