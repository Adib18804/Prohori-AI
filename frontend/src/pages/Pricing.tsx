import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CreditCard, LockKeyhole, Shield, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Plan = { id: string; code: string; name: string; price: number; monthly_debates: number; billing_cycle: string; category: string; is_popular: boolean; features: string[] };
type Checkout = { session_id: string; client_secret: string; plan: { name: string; price: number; billing_cycle: string } };
const API = 'http://localhost:8000/api/v1';

export default function Pricing() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/plans/public`).then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: Plan[]) => setPlans(data)).catch(() => setError('Plans could not be loaded. Please refresh to try again.'));
  }, []);

  const visible = useMemo(() => plans.filter((p) => p.billing_cycle === cycle || p.billing_cycle === 'lifetime' || p.billing_cycle === 'custom'), [plans, cycle]);

  const startCheckout = async (plan: Plan) => {
    if (!user || !token) { navigate('/login?redirect=/pricing'); return; }
    if (plan.price <= 0) { navigate('/chat'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch(`${API}/billing/create-checkout-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Checkout could not be started.');
      setCheckout(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Checkout could not be started.'); }
    finally { setBusy(false); }
  };

  const confirmPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!checkout || !token) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`${API}/billing/webhook`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event: 'payment_success', session_id: checkout.session_id, client_secret: checkout.client_secret }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Payment could not be confirmed.');
      setCheckout(null); navigate('/billing?success=true');
    } catch (e) { setError(e instanceof Error ? e.message : 'Payment could not be confirmed.'); }
    finally { setBusy(false); }
  };

  return <main className="min-h-screen overflow-x-hidden bg-[#080910] text-white">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,.2),transparent_65%)]" />
    <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-violet-200"><Shield size={15}/> SECURITY THAT SCALES WITH YOU</div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Confidence for every <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">AI interaction.</span></h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">Choose a protection plan for your team. Every request gets clear, explainable security review.</p>
        <div className="mt-8 inline-flex max-w-full rounded-xl border border-white/10 bg-white/[.04] p-1">
          {(['monthly', 'yearly'] as const).map((item) => <button key={item} onClick={() => setCycle(item)} className={`min-h-11 rounded-lg px-4 text-sm capitalize transition sm:px-5 ${cycle === item ? 'bg-white text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}>{item}{item === 'yearly' && <span className="ml-2 text-violet-500">Save</span>}</button>)}
        </div>
      </div>
      {error && <p role="alert" className="mx-auto mt-6 max-w-xl rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      <div className="mt-10 grid min-w-0 grid-cols-1 gap-5 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((plan, index) => <motion.article key={plan.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .07 }} className={`relative rounded-3xl p-px ${plan.is_popular ? 'bg-gradient-to-br from-violet-400 via-fuchsia-400 to-cyan-300' : 'bg-white/10'}`}>
          <div className="flex h-full flex-col rounded-[23px] bg-[#10111b] p-7 sm:p-8">
            {plan.is_popular && <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-violet-400/15 px-3 py-1 text-xs font-medium text-violet-200"><Sparkles size={13}/> Most popular</span>}
            <p className="text-sm font-medium text-slate-300">{plan.name}</p>
            <div className="mt-5 flex items-baseline gap-2"><span className="text-4xl font-semibold tracking-tight">${plan.price.toLocaleString()}</span><span className="text-sm text-slate-500">/{plan.billing_cycle === 'yearly' ? 'year' : plan.billing_cycle === 'lifetime' ? 'once' : 'month'}</span></div>
            <p className="mt-3 text-sm text-slate-400">{plan.monthly_debates.toLocaleString()} protected requests</p>
            <button disabled={busy} onClick={() => startCheckout(plan)} className={`mt-7 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${plan.is_popular ? 'bg-white text-slate-950 hover:bg-violet-100' : 'border border-white/15 bg-white/[.04] hover:bg-white/10'}`}>{plan.price === 0 ? 'Get started' : busy ? 'Preparing checkout…' : 'Choose plan'}</button>
            <div className="my-7 h-px bg-white/10"/><p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Included</p>
            <ul className="space-y-3">{(plan.features || []).map((feature) => <li key={feature} className="flex gap-3 text-sm text-slate-300"><Check size={16} className="mt-0.5 shrink-0 text-emerald-300"/>{feature}</li>)}</ul>
          </div>
        </motion.article>)}
      </div>
      {plans.length === 0 && !error && <div className="mt-10 text-center text-sm text-slate-500">Loading plans…</div>}
      <p className="mt-10 text-center text-xs text-slate-500"><LockKeyhole size={13} className="mr-1 inline"/> Demo checkout only. No card information is transmitted or stored.</p>
    </section>

    <AnimatePresence>{checkout && <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setCheckout(null); }}>
      <motion.section role="dialog" aria-modal="true" aria-labelledby="checkout-title" initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90dvh] w-full max-w-[90vw] overflow-y-auto rounded-3xl border border-white/10 bg-[#11121c] p-5 shadow-2xl sm:max-w-md sm:p-8">
        <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-violet-300">Secure checkout · Demo</p><h2 id="checkout-title" className="mt-2 text-2xl font-semibold">{checkout.plan.name}</h2><p className="mt-1 text-sm text-slate-400">${checkout.plan.price} / {checkout.plan.billing_cycle}</p></div><button onClick={() => setCheckout(null)} aria-label="Close checkout" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"><X size={18}/></button></div>
        <form onSubmit={confirmPayment} className="mt-7 space-y-4">
          <label className="block text-sm text-slate-300">Name on card<input required autoComplete="cc-name" placeholder="Alex Morgan" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-400"/></label>
          <label className="block text-sm text-slate-300">Card number<input required inputMode="numeric" autoComplete="cc-number" minLength={12} maxLength={23} placeholder="4242 4242 4242 4242" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-400"/></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm text-slate-300">Expiry<input required autoComplete="cc-exp" placeholder="MM / YY" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-400"/></label><label className="text-sm text-slate-300">CVC<input required inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="123" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-400"/></label></div>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <p className="text-xs leading-5 text-slate-500">This demo confirms a simulated payment. Do not enter real payment details; the form data is discarded.</p>
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-semibold disabled:opacity-50"><CreditCard size={17}/>{busy ? 'Confirming…' : `Confirm $${checkout.plan.price}`}</button>
        </form>
      </motion.section>
    </motion.div>}</AnimatePresence>
  </main>;
}
