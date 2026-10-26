import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { FileText, Download, Calendar, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Select, Label } from '@/components/ui/Input';

export default function AuditReport() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, days]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getAnalytics(days, token);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = () => {
    // In a real implementation, this would generate an actual PDF
    // For now, we'll create a downloadable HTML report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Prohori AI Security Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 30px; }
    .metric { background: #f3f4f6; padding: 15px; margin: 10px 0; border-left: 4px solid #7c3aed; }
    .metric-value { font-size: 24px; font-weight: bold; color: #7c3aed; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #7c3aed; color: white; }
  </style>
</head>
<body>
  <h1>Prohori AI Security Audit Report</h1>
  
  <div class="metadata">
    <p><strong>Generated:</strong> ${format(new Date(), 'PPpp')}</p>
    <p><strong>Reporting Period:</strong> Last ${days} days</p>
    <p><strong>Organization:</strong> Prohori AI Security Gateway</p>
  </div>

  <h2>Executive Summary</h2>
  <p>This report provides a comprehensive overview of security decisions made by the Prohori AI multi-agent security gateway during the reporting period.</p>

  <h2>Security Metrics</h2>
  
  <div class="metric">
    <strong>Total Requests Analyzed</strong><br>
    <span class="metric-value">${analytics?.total_requests.toLocaleString() || 0}</span>
  </div>

  <div class="metric">
    <strong>Allowed Requests</strong><br>
    <span class="metric-value" style="color: #22c55e;">${analytics?.allowed.toLocaleString() || 0}</span>
    <span style="color: #666;"> (${analytics ? ((analytics.allowed / analytics.total_requests) * 100).toFixed(1) : 0}%)</span>
  </div>

  <div class="metric">
    <strong>Blocked Requests</strong><br>
    <span class="metric-value" style="color: #ef4444;">${analytics?.blocked.toLocaleString() || 0}</span>
    <span style="color: #666;"> (${analytics ? ((analytics.blocked / analytics.total_requests) * 100).toFixed(1) : 0}%)</span>
  </div>

  <div class="metric">
    <strong>Redacted Requests</strong><br>
    <span class="metric-value" style="color: #eab308;">${analytics?.redacted.toLocaleString() || 0}</span>
    <span style="color: #666;"> (${analytics ? ((analytics.redacted / analytics.total_requests) * 100).toFixed(1) : 0}%)</span>
  </div>

  <div class="metric">
    <strong>High-Risk Incidents</strong><br>
    <span class="metric-value" style="color: #dc2626;">${analytics?.high_risk_incidents.toLocaleString() || 0}</span>
  </div>

  <h2>Performance Metrics</h2>
  
  <div class="metric">
    <strong>Average Confidence Score</strong><br>
    <span class="metric-value">${analytics ? (analytics.avg_confidence * 100).toFixed(1) : 0}%</span>
    <p style="margin-top: 5px; color: #666;">High confidence indicates accurate security decisions</p>
  </div>

  <div class="metric">
    <strong>Average Processing Time</strong><br>
    <span class="metric-value">${analytics?.avg_processing_time_ms.toFixed(0) || 0}ms</span>
    <p style="margin-top: 5px; color: #666;">Fast response times maintain user experience</p>
  </div>

  <div class="metric">
    <strong>Debate Rate</strong><br>
    <span class="metric-value">${analytics ? ((analytics.debates_triggered / analytics.total_requests) * 100).toFixed(1) : 0}%</span>
    <p style="margin-top: 5px; color: #666;">Percentage of requests requiring full multi-agent analysis</p>
  </div>

  <h2>Security Architecture</h2>
  <p>Prohori AI uses a multi-agent adversarial debate system:</p>
  <ul>
    <li><strong>Triage Agent:</strong> Fast initial classification (SAFE/SUSPICIOUS/HIGH_RISK)</li>
    <li><strong>Prosecutor Agent:</strong> Builds evidence for blocking malicious prompts</li>
    <li><strong>Defender Agent:</strong> Constructs benign interpretations to reduce false positives</li>
    <li><strong>Judge Agent:</strong> Renders final verdict with explainable reasoning</li>
  </ul>

  <h2>Key Features</h2>
  <ul>
    <li>✓ Explainable AI: Every decision includes plain-English reasoning</li>
    <li>✓ RAG Attack Memory: Self-improving knowledge base of attack patterns</li>
    <li>✓ Fast Lane Optimization: Benign requests bypass debate for efficiency</li>
    <li>✓ Complete Audit Trail: All decisions persisted for compliance review</li>
    <li>✓ Privacy-First: No raw customer data in long-term storage</li>
  </ul>

  <h2>Responsible AI Statement</h2>
  <p>Prohori AI is an AI-assisted security layer that provides explainable, auditable decisions. While designed to maximize accuracy, no security system is perfect. We recommend:</p>
  <ul>
    <li>Regular human review of blocked requests</li>
    <li>Continuous monitoring of confidence scores</li>
    <li>Incident investigation for high-risk events</li>
    <li>Periodic evaluation against ground truth data</li>
  </ul>

  <div class="footer">
    <p><strong>Prohori AI Security Gateway</strong></p>
    <p>Every Prompt Defended. Every Verdict Explained.</p>
    <p>This report was auto-generated by Prohori AI's audit system.</p>
    <p>For questions or concerns, contact your security administrator.</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prohori-audit-report-${format(new Date(), 'yyyy-MM-dd')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Audit Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate compliance-ready security audit reports
          </p>
        </div>

        {/* Report Configuration */}
        <div className="rounded-xl bg-surface border border-border p-5 mb-4 shadow-card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold">Report Configuration</h2>
          </div>

          <div>
            <Label htmlFor="period">Reporting Period</Label>
            <Select
              id="period"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>Last year</option>
            </Select>
          </div>
        </div>

        {/* Report Preview */}
        {analytics && !loading && (
          <div className="rounded-xl bg-surface border border-border p-5 mb-4 shadow-card">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <h2 className="text-sm font-semibold">Report Preview</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-background/60 border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1">Total Requests</div>
                  <div className="text-xl font-bold tabular-nums">{analytics.total_requests.toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-background/60 border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1">Protection Rate</div>
                  <div className="text-xl font-bold tabular-nums text-danger">
                    {((analytics.blocked + analytics.redacted) / analytics.total_requests * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-background/60 border border-border p-4">
                <h3 className="font-semibold mb-2.5 text-sm">Verdict Distribution</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-success">Allowed</span>
                    <span className="tabular-nums">{analytics.allowed.toLocaleString()} ({(analytics.allowed / analytics.total_requests * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-danger">Blocked</span>
                    <span className="tabular-nums">{analytics.blocked.toLocaleString()} ({(analytics.blocked / analytics.total_requests * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warning">Redacted</span>
                    <span className="tabular-nums">{analytics.redacted.toLocaleString()} ({(analytics.redacted / analytics.total_requests * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-background/60 border border-border p-4">
                <h3 className="font-semibold mb-2.5 text-sm">Performance Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Confidence</span>
                    <span className="tabular-nums">{(analytics.avg_confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Processing Time</span>
                    <span className="tabular-nums">{analytics.avg_processing_time_ms.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">High-Risk Incidents</span>
                    <span className="tabular-nums text-danger">{analytics.high_risk_incidents.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-xl bg-surface border border-border p-12 text-center mb-4">
            <div className="animate-pulse-glow w-10 h-10 mx-auto mb-4 rounded-full accent-gradient" />
            <p className="text-sm text-muted-foreground">Loading report data…</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={generatePDFReport}
            disabled={loading || !analytics}
            size="lg"
            className="flex-1"
          >
            <Download className="w-4 h-4" />
            Export Audit Report
          </Button>
          <Button variant="secondary" size="lg" onClick={loadData} disabled={loading}>
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Reports are generated in HTML format and can be printed to PDF
        </p>
      </div>
    </div>
  );
}