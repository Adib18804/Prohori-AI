import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, CheckCircle2, CreditCard, Loader2, Shield, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = 'http://localhost:8000/api/v1';
type Usage = { plan_code: string; plan_name: string; monthly_debates: number; debates_used: number; debates_remaining: number; usage_percent: number; reset_date: string | null };
type Subscription = { plan_code: string; plan_name: string; status: string; current_period_end: string | null };

export default function Billing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { token } = useAuth();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(params.get('success') === 'true' ? 'Your plan is active. Welcome aboard.' : '');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) { navigate('/login?redirect=/billing'); return; }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usageResponse, subscriptionResponse] = await Promise.all([fetch(`${API}/billing/usage`, { headers }), fetch(`${API}/billing/me`, { headers })]);
      if (!usageResponse.ok || !subscriptionResponse.ok) throw new Error('Billing information could not be loaded.');
      setUsage(await usageResponse.json()); setSubscription(await subscriptionResponse.json());
    } catch (e) { setError(e instanceof Error ? e.message : 'Billing information could not be loaded.'); }
    finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { void load(); }, [load]);

  const cancel = async () => {
    if (!token || !window.confirm('Cancel your subscription and switch to the Free plan?')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${API}/billing/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Could not cancel subscription.');
      setMessage('Subscription canceled. Your account is now on the Free plan.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not cancel subscription.'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#080910] text-violet-300"><Loader2 className="animate-spin"/></div>;
  if (!usage || !subscription) return <div className="min-h-screen bg-[#080910] p-10 text-center text-slate-300">{error || 'Billing is unavailable.'}<button onClick={() => void load()} className="ml-3 text-violet-300">Retry</button></div>;

  const active = subscription.status === 'active';
  const percent = Math.min(100, Math.max(0, usage.usage_percent));
  const period = subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'No upcoming billing date';

  return <main className="min-h-screen bg-[#080910] px-5 py-12 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <div className="mb-9"><div className="mb-3 flex items-center gap-2 text-sm text-violet-300"><Shield size={16}/> Account</div><h1 className="text-3xl font-semibold tracking-tight">Billing & subscription</h1><p className="mt-2 text-slate-400">Manage your protection plan and request allowance.</p></div>
    {message && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"><CheckCircle2 size={17}/>{message}</p>}
    {error && <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"><XCircle size={17}/>{error}</p>}
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#141522] to-[#0e0f17] p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start"><div><div className="flex items-center gap-3"><h2 className="text-2xl font-semibold">{subscription.plan_name}</h2><span className={`rounded-full px-3 py-1 text-xs font-medium ${active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/10 text-slate-400'}`}>{active ? 'Active' : 'Free plan'}</span></div><p className="mt-2 text-sm text-slate-400">{active ? 'Your subscription is providing protection.' : 'Upgrade for more protected requests and advanced features.'}</p></div>
        <div className="flex gap-3">{!active ? <button onClick={() => navigate('/pricing')} className="min-h-11 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-violet-100">Explore plans <ArrowUpRight size={15} className="ml-1 inline"/></button> : <button disabled={busy} onClick={() => void cancel()} className="min-h-11 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 hover:border-red-300/40 hover:text-red-200 disabled:opacity-50">{busy ? 'Canceling…' : 'Cancel subscription'}</button>}</div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-white/8 bg-white/[.03] p-5"><div className="flex items-center gap-2 text-sm text-slate-400"><CalendarDays size={16}/> Next billing date</div><p className="mt-3 text-lg font-medium">{active ? period : '—'}</p></div><div className="rounded-2xl border border-white/8 bg-white/[.03] p-5"><div className="flex items-center gap-2 text-sm text-slate-400"><CreditCard size={16}/> Payment method</div><p className="mt-3 text-lg font-medium">{active ? 'Simulated checkout' : 'No payment method'}</p></div></div>
      <div className="mt-8"><div className="mb-3 flex justify-between text-sm"><span className="text-slate-300">Protected requests</span><span className="text-slate-400">{usage.debates_used.toLocaleString()} / {usage.monthly_debates.toLocaleString()}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all" style={{ width: `${percent}%` }}/></div><p className="mt-2 text-xs text-slate-500">{usage.debates_remaining.toLocaleString()} requests remaining · {usage.plan_code}</p></div>
    </section>
    <section className="mt-6 rounded-3xl border border-white/10 bg-[#10111a] p-6 sm:p-8"><h2 className="font-semibold">Billing history</h2><p className="mt-2 text-sm text-slate-400">This simulated checkout does not charge a card or create real invoices.</p></section>
  </div></main>;
}
