import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { AlertTriangle, Shield, Eye, RefreshCw, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { IncidentRow } from '@/components/features/IncidentRow';
import { cn } from '@/lib/utils';

const severityVariant: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

const statusColor: Record<string, string> = {
  detected: 'text-warning',
  investigating: 'text-info',
  confirmed: 'text-danger',
  false_positive: 'text-success',
  resolved: 'text-muted-foreground',
};

export default function IncidentViewer() {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  useEffect(() => {
    if (token) {
      loadIncidents();
    }
  }, [token]);

  const loadIncidents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getIncidents(token);
      setIncidents(data);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-36 mb-8" />
        <div className="space-y-3 max-w-3xl">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Incident List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Security Incidents</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {incidents.length} incident{incidents.length !== 1 ? 's' : ''} detected
              </p>
            </div>
            <Button variant="secondary" onClick={loadIncidents}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>

          {incidents.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-dashed border-border bg-surface/40">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
                <Shield className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No incidents detected</p>
              <p className="text-sm text-muted-foreground">All requests have been processed safely</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <IncidentRow
                  key={incident.incident_id}
                  incident={incident}
                  selected={selectedIncident?.incident_id === incident.incident_id}
                  onClick={() => setSelectedIncident(incident)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Incident Details */}
      <aside className="w-96 flex-shrink-0 border-l border-border bg-surface/40 p-6 overflow-y-auto">
        {selectedIncident ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">Incident Details</h2>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-surface-2 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-background/60 border border-border p-4">
                <div className="text-xs text-muted-foreground mb-1">Incident Type</div>
                <div className="font-semibold text-sm">
                  {selectedIncident.incident_type.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 rounded-lg bg-background/60 border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1.5">Severity</div>
                  <Badge variant={severityVariant[selectedIncident.severity] ?? 'default'}>
                    {selectedIncident.severity}
                  </Badge>
                </div>
                <div className="flex-1 rounded-lg bg-background/60 border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1.5">Status</div>
                  <div className={cn('font-medium text-sm', statusColor[selectedIncident.status])}>
                    {selectedIncident.status.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 rounded-lg bg-background/60 border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                  <div className="text-lg font-bold tabular-nums">
                    {(selectedIncident.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="flex-1 rounded-lg bg-background/60 border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1">Verdict</div>
                  <div className="font-mono font-semibold text-sm text-danger">
                    {selectedIncident.verdict}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-background/60 border border-border p-4">
                <div className="text-xs text-muted-foreground mb-1">Incident ID</div>
                <div className="font-mono text-xs break-all">{selectedIncident.incident_id}</div>
              </div>

              <div className="rounded-lg bg-background/60 border border-border p-4">
                <div className="text-xs text-muted-foreground mb-1">Detected At</div>
                <div className="text-sm font-medium">
                  {format(new Date(selectedIncident.created_at), 'PPpp')}
                </div>
              </div>

              <a
                href={`/debates/${selectedIncident.request_id}`}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-lg accent-gradient text-white text-sm font-medium shadow-glow-sm hover:shadow-glow transition-shadow"
              >
                <Eye className="w-4 h-4" />
                View Debate Transcript
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
                <Inbox className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Select an incident to view details
              </p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
