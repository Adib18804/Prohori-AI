import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Zap,
  Shield,
  Clock,
  User,
  Ban,
  ChevronRight,
  RefreshCw,
  Radio,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = '/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alert {
  id: string;
  user_id: string;
  user_email: string;
  username: string;
  prompt: string;
  attack_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  verdict: string;
  incident_type: string;
  status: string;
  timestamp: string | null;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface QuickBanModalState {
  open: boolean;
  alert: Alert | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityColor(level: string) {
  switch (level) {
    case 'CRITICAL':
      return {
        bg: 'bg-[#7F1D1D]',
        border: 'border-[#EF4444]/50',
        badge: 'bg-[#EF4444]/20 text-[#EF4444]',
        dot: 'bg-[#EF4444]',
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.25)]',
      };
    case 'HIGH':
      return {
        bg: 'bg-[#431407]',
        border: 'border-[#F97316]/50',
        badge: 'bg-[#F97316]/20 text-[#F97316]',
        dot: 'bg-[#F97316]',
        glow: 'shadow-[0_0_12px_rgba(249,115,22,0.2)]',
      };
    default:
      return {
        bg: 'bg-[#1A1A24]',
        border: 'border-[#2A2A38]',
        badge: 'bg-[#8B8B9E]/20 text-[#8B8B9E]',
        dot: 'bg-[#8B8B9E]',
        glow: '',
      };
  }
}

function formatRelativeTime(ts: string | null): string {
  if (!ts) return 'Unknown';
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

function formatAttackType(raw: string): string {
  if (!raw) return 'Unknown';
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium pointer-events-auto transition-all
            ${t.type === 'success'
              ? 'bg-[#0A2E1A] border-[#10B981]/40 text-[#10B981]'
              : 'bg-[#2E0A0A] border-[#EF4444]/40 text-[#EF4444]'
            }`}
        >
          {t.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Quick Ban Modal (from alert) ─────────────────────────────────────────────

interface QuickBanModalProps {
  state: QuickBanModalState;
  token: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function QuickBanModal({ state, token, onClose, onSuccess, onError }: QuickBanModalProps) {
  const [mode, setMode] = useState<'24h' | 'permanent'>('24h');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.open && state.alert) {
      setReason(`Automated threat detected: ${state.alert.attack_type}. Banned from alert panel.`);
      setMode('24h');
    }
  }, [state.open, state.alert]);

  if (!state.open || !state.alert) return null;

  const handleBan = async () => {
    setLoading(true);
    try {
      const body =
        mode === 'permanent'
          ? { permanent: true, reason }
          : { duration_hours: 24, reason };

      const res = await fetch(
        `${API_BASE}/admin/users/${state.alert!.user_id}/ban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        onSuccess(
          `${state.alert!.username} banned (${mode === 'permanent' ? 'permanent' : '24h'}) from alert.`
        );
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        onError(err.detail || 'Failed to ban user.');
      }
    } catch {
      onError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-[#12121A] border border-[#EF4444]/30 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A2A38] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-[#EF4444]" />
            <span className="text-sm font-semibold text-[#E8E8F0]">Quick Ban</span>
            <span className="text-xs text-[#8B8B9E]">— {state.alert.user_email}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#1A1A24] rounded-lg" aria-label="Close">
            <X className="w-4 h-4 text-[#8B8B9E]" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Attack context */}
          <div className="px-3 py-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444]">
            <span className="font-semibold">Threat:</span> {formatAttackType(state.alert.attack_type)} &bull; {state.alert.risk_level}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMode('24h')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                mode === '24h'
                  ? 'bg-[#7C3AED]/20 border-[#7C3AED]/50 text-[#D946EF]'
                  : 'bg-[#0A0A0F] border-[#2A2A38] text-[#8B8B9E]'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setMode('permanent')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                mode === 'permanent'
                  ? 'bg-[#EF4444]/20 border-[#EF4444]/50 text-[#EF4444]'
                  : 'bg-[#0A0A0F] border-[#2A2A38] text-[#8B8B9E]'
              }`}
            >
              Permanent
            </button>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-[#0A0A0F] border border-[#2A2A38] rounded-lg text-xs text-[#E8E8F0] placeholder-[#8B8B9E] focus:outline-none focus:border-[#7C3AED] resize-none"
            placeholder="Reason…"
          />

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs bg-[#1A1A24] text-[#8B8B9E] border border-[#2A2A38]">
              Cancel
            </button>
            <button
              id="quick-ban-confirm-btn"
              onClick={handleBan}
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#EF4444] hover:bg-[#DC2626] text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Banning…' : 'Confirm Ban'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

interface AlertCardProps {
  alert: Alert;
  onTakeAction: (alert: Alert) => void;
  onQuickBan: (alert: Alert) => void;
  isNew: boolean;
}

function AlertCard({ alert, onTakeAction, onQuickBan, isNew }: AlertCardProps) {
  const colors = severityColor(alert.risk_level);

  return (
    <div
      className={`relative flex flex-col items-stretch gap-3 rounded-xl border px-4 py-4 transition-all sm:flex-row sm:items-start sm:gap-4 sm:px-5
        ${colors.border} ${colors.glow}
        bg-[#0D0D15]
        ${isNew ? 'animate-[pulse_1s_ease-in-out]' : ''}
      `}
    >
      {/* Severity dot */}
      <div className="flex-shrink-0 mt-1">
        <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} ${alert.risk_level === 'CRITICAL' ? 'animate-pulse' : ''}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${colors.badge}`}>
              {alert.risk_level}
            </span>
            <span className="text-xs font-semibold text-[#E8E8F0]">
              {formatAttackType(alert.attack_type)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8B8B9E] flex-shrink-0">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(alert.timestamp)}
          </div>
        </div>

        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[#8B8B9E]">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="font-medium text-[#C4C4D4]">{alert.user_email}</span>
          <span className="text-[#3A3A48]">•</span>
          <span className="min-w-0 flex-1 truncate sm:max-w-xs" title={alert.prompt}>
            {alert.prompt}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
        <button
          id={`take-action-${alert.id}`}
          onClick={() => onTakeAction(alert)}
          className="flex min-h-11 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold
            bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#D946EF]
            border border-[#7C3AED]/30 hover:border-[#7C3AED]/50
            transition-all"
          aria-label={`Take action on alert from ${alert.user_email}`}
        >
          Take Action
          <ChevronRight className="w-3 h-3" />
        </button>
        <button
          id={`quick-ban-${alert.id}`}
          onClick={() => onQuickBan(alert)}
          className="flex min-h-11 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold
            bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444]
            border border-[#EF4444]/30 hover:border-[#EF4444]/50
            transition-all"
          aria-label={`Quick ban ${alert.user_email}`}
        >
          <Ban className="w-3 h-3" />
          Ban
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminHome() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [quickBanModal, setQuickBanModal] = useState<QuickBanModalState>({
    open: false,
    alert: null,
  });
  const prevAlertIdsRef = useRef<Set<string>>(new Set());

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Fetch alerts ───────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.warn(`Admin alerts request failed with status ${res.status}`);
        return;
      }

      const data = await res.json();
      console.log("Fetched alerts:", data);

      const incoming: Alert[] = Array.isArray(data.alerts) ? data.alerts : [];

      // Detect genuinely new alerts (not in previous fetch)
      const incoming_ids = new Set(incoming.map((a) => a.id));
      const brandNew = new Set(
        [...incoming_ids].filter((id) => !prevAlertIdsRef.current.has(id))
      );
      prevAlertIdsRef.current = incoming_ids;

      if (brandNew.size > 0) {
        setNewAlertIds(brandNew);
        setTimeout(() => setNewAlertIds(new Set()), 2000);
      }

      setAlerts(incoming);
      setLastUpdated(new Date());
    } catch (err) {
      // Silent — don't spam errors in background polling, but keep a breadcrumb.
      console.warn("Failed to fetch admin alerts:", err);
    } finally {
      setAlertsLoading(false);
    }
  }, [token]);

  // Initial fetch + 10-second polling
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTakeAction = (alert: Alert) => {
    navigate(`/admin/users?q=${encodeURIComponent(alert.user_email)}`);
  };

  const handleQuickBan = (alert: Alert) => {
    setQuickBanModal({ open: true, alert });
  };

  const criticalCount = alerts.filter((a) => a.risk_level === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.risk_level === 'HIGH').length;

  return (
    <>
      <ToastList toasts={toasts} onDismiss={dismissToast} />
      <QuickBanModal
        state={quickBanModal}
        token={token || ''}
        onClose={() => setQuickBanModal({ open: false, alert: null })}
        onSuccess={(msg) => addToast('success', msg)}
        onError={(msg) => addToast('error', msg)}
      />

      <div className="space-y-8">
        {/* ── Live Threat Alerts ─────────────────────────────────────────── */}
        <section
          aria-labelledby="live-alerts-heading"
          className="rounded-2xl border border-[#EF4444]/20 bg-gradient-to-br from-[#0D0D15] to-[#120A0A] overflow-hidden"
        >
          {/* Section header */}
          <div className={`flex flex-col items-stretch gap-3 border-b border-[#EF4444]/15 bg-[#EF4444]/5 px-4 py-4 transition-shadow sm:flex-row sm:items-center sm:justify-between sm:px-6 ${newAlertIds.size > 0 ? 'animate-pulse shadow-[inset_0_0_28px_rgba(239,68,68,0.16)]' : ''}`}>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-[#EF4444]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#EF4444]" />
                </div>
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </div>
              <div>
                <h1
                  id="live-alerts-heading"
                  className="text-base font-bold text-[#E8E8F0] flex items-center gap-2"
                >
                  🚨 Live Threat Alerts
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-1.5 py-0.5 rounded-full">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    LIVE
                  </span>
                </h1>
                <p className="text-xs text-[#8B8B9E]">
                  Highest-risk blocked requests — auto-refreshes every 10s
                </p>
              </div>
            </div>

            {/* Status & refresh */}
            <div className="flex items-center gap-3">
              {/* Summary badges */}
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                  <AlertTriangle className="w-3 h-3" />
                  {criticalCount} Critical
                </span>
              )}
              {highCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30">
                  {highCount} High
                </span>
              )}

              <button
                id="refresh-alerts-btn"
                onClick={() => { setAlertsLoading(true); fetchAlerts(); }}
                className="p-2 hover:bg-[#1A1A24] rounded-lg transition-colors"
                aria-label="Refresh alerts"
                title="Refresh now"
              >
                <RefreshCw className={`w-4 h-4 text-[#8B8B9E] ${alertsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Alert list */}
          <div className="p-4 space-y-2.5">
            {alertsLoading && alerts.length === 0 ? (
              <div className="flex items-center justify-center py-10 gap-2 text-[#8B8B9E] text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading alerts…
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#10B981]" />
                </div>
                <p className="text-sm text-[#8B8B9E]">No active threats detected. All systems secure.</p>
                <p className="text-xs text-[#3A3A48]">Monitoring continues in the background.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onTakeAction={handleTakeAction}
                  onQuickBan={handleQuickBan}
                  isNew={newAlertIds.has(alert.id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {lastUpdated && (
            <div className="px-5 py-2.5 border-t border-[#1A1A24] flex items-center justify-between text-[10px] text-[#3A3A48]">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <span>Showing up to 10 most recent HIGH/CRITICAL incidents</span>
            </div>
          )}
        </section>

        {/* ── Quick-nav cards ────────────────────────────────────────────── */}
        <section aria-label="Quick navigation">
          <h2 className="text-sm font-semibold text-[#8B8B9E] uppercase tracking-wider mb-4">
            Control Center
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                id: 'nav-users',
                icon: User,
                title: 'User Management',
                desc: 'View, warn, and ban users.',
                href: '/admin/users',
                accent: 'from-[#7C3AED] to-[#D946EF]',
                border: 'border-[#7C3AED]/20 hover:border-[#7C3AED]/40',
              },
              {
                id: 'nav-attacks',
                icon: Shield,
                title: 'Attack Patterns',
                desc: 'Analyze threat classifications.',
                href: '/admin/attacks',
                accent: 'from-[#EF4444] to-[#F97316]',
                border: 'border-[#EF4444]/20 hover:border-[#EF4444]/40',
              },
              {
                id: 'nav-requests',
                icon: Zap,
                title: 'Request Log',
                desc: 'Inspect all protected requests.',
                href: '/admin/requests',
                accent: 'from-[#3B82F6] to-[#06B6D4]',
                border: 'border-[#3B82F6]/20 hover:border-[#3B82F6]/40',
              },
            ].map((card) => (
              <button
                key={card.id}
                id={card.id}
                onClick={() => navigate(card.href)}
                className={`group flex items-center gap-4 p-5 rounded-xl bg-[#12121A] border ${card.border} transition-all text-left`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#E8E8F0]">{card.title}</div>
                  <div className="text-xs text-[#8B8B9E] mt-0.5">{card.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#3A3A48] group-hover:text-[#8B8B9E] ml-auto flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
