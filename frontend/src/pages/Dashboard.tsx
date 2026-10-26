import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, Activity, RefreshCw, MessagesSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { MetricCard } from '@/components/ui/MetricCard';

const API_BASE = '/api/v1';

interface MyAnalytics {
  total_requests: number;
  blocked_requests: number;
  avg_risk_score: number;
}

/** Map a 0–1 risk score to a short, human-readable severity label. */
function riskLabel(score: number): string {
  if (score >= 0.75) return 'High risk exposure';
  if (score >= 0.4) return 'Moderate risk exposure';
  return 'Low risk exposure';
}

export default function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<MyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/analytics/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data: MyAnalytics = await res.json();
      setAnalytics({
        total_requests: data.total_requests ?? 0,
        blocked_requests: data.blocked_requests ?? 0,
        avg_risk_score: data.avg_risk_score ?? 0,
      });
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Could not load your analytics. Please try again.');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && !analytics) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error (network / server failure) ───────────────────────────────────────
  if (error && !analytics) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-danger/40 bg-surface p-12 text-center shadow-card">
            <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-danger" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Analytics unavailable</h2>
              <p className="text-base text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="secondary" onClick={loadAnalytics}>
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state (genuinely no requests yet) ────────────────────────────────
  if (!analytics || analytics.total_requests === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-surface p-12 text-center shadow-card">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessagesSquare className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">No requests yet</h2>
              <p className="text-lg text-muted-foreground mt-2">
                Go to chat to start — your protection stats will appear here.
              </p>
            </div>
            <Button onClick={() => navigate('/chat')}>
              <MessagesSquare className="w-4 h-4" />
              Go to Chat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Populated dashboard ────────────────────────────────────────────────────
  const riskPct = Math.round((analytics.avg_risk_score ?? 0) * 100);
  const blockRate =
    analytics.total_requests > 0
      ? ((analytics.blocked_requests / analytics.total_requests) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Security Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stats for every prompt you have submitted through Prohori AI
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            label="Total Requests"
            value={analytics.total_requests.toLocaleString()}
            sub="Prompts analysed by the agent pipeline"
            icon={Shield}
            iconColor="text-primary"
            delay={0}
          />
          <MetricCard
            label="Blocked Requests"
            value={analytics.blocked_requests.toLocaleString()}
            sub={`${blockRate}% of your traffic stopped`}
            icon={ShieldAlert}
            iconColor="text-danger"
            trend={{ value: `${blockRate}%`, positive: analytics.blocked_requests === 0 }}
            delay={0.06}
          />
          <MetricCard
            label="Average Risk Score"
            value={`${riskPct}%`}
            sub={riskLabel(analytics.avg_risk_score)}
            icon={Activity}
            iconColor="text-warning"
            trend={{ value: riskPct > 50 ? 'Elevated' : 'Normal', positive: riskPct <= 50 }}
            delay={0.12}
          />
        </div>
      </div>
    </div>
  );
}
