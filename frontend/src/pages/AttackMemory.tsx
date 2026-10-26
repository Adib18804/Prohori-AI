import { Database, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

const steps = [
  {
    title: 'Pattern Detection',
    desc: 'When a malicious prompt is blocked with high confidence, the system analyzes its structure',
  },
  {
    title: 'Anonymization',
    desc: 'Personal data, secrets, and company-specific information are removed',
  },
  {
    title: 'Embedding & Storage',
    desc: 'Attack pattern is embedded and stored in pgvector for similarity search',
  },
  {
    title: 'Future Matching',
    desc: 'Similar future attacks are detected faster using vector similarity search',
  },
];

export default function AttackMemory() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Attack Memory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            RAG-based knowledge base of known attack patterns
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard label="Attack Patterns" value={0} icon={Database} delay={0} />
          <MetricCard
            label="Confirmed Incidents"
            value={0}
            icon={TrendingUp}
            iconColor="text-success"
            delay={0.06}
          />
          <MetricCard
            label="Memory Accuracy"
            value="100%"
            icon={Shield}
            iconColor="text-accent"
            delay={0.12}
          />
        </div>

        <div className="rounded-xl bg-surface border border-border p-5 mb-4 shadow-card">
          <h2 className="text-sm font-semibold mb-5">How Attack Memory Works</h2>
          <div className="space-y-5">
            {steps.map((s, i) => (
              <div key={s.title} className="flex gap-3.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full accent-gradient flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold mb-0.5">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-warning/5 border border-warning/25 p-5">
          <div className="flex gap-3.5">
            <div className="p-2 rounded-lg bg-warning/10 border border-warning/25 h-fit">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="font-semibold text-warning text-sm mb-2">Privacy-First Design</div>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• No raw customer prompts are stored in long-term memory</li>
                <li>• PII and secrets are automatically removed</li>
                <li>• Only anonymized attack patterns are retained</li>
                <li>• Memory can be cleared at any time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
