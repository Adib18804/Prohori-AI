import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api, DebateTranscript } from '@/services/api';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { DebateTimeline } from '@/components/features/DebateTimeline';

export default function DebateTranscriptPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [debate, setDebate] = useState<DebateTranscript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token || !id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getDebate(id, token);
      setDebate(data);
    } catch {
      setError('Failed to load debate transcript.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, id]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/incidents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Debate Transcript</h1>
              {debate && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {debate.request_id}
                </p>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {debate && (
          <div className="rounded-xl bg-surface border border-border p-4 mb-4 shadow-card">
            <div className="text-xs text-muted-foreground mb-1.5">Original Prompt</div>
            <p className="text-sm font-mono bg-background/60 border border-border rounded-lg p-3 break-words">
              {debate.prompt}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline">{debate.rag_matches} RAG matches</Badge>
              <Badge variant="outline">{debate.processing_time_ms}ms</Badge>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm p-4">
            {error}
          </div>
        )}

        {debate && !loading && (
          <DebateTimeline
            triage={debate.triage}
            prosecutor={debate.prosecutor}
            defender={debate.defender}
            verdict={debate.verdict}
            ragMatches={debate.rag_matches}
          />
        )}
      </div>
    </div>
  );
}
