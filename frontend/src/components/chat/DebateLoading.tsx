import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Gavel, Loader2, Scale, Shield } from 'lucide-react';

const stages = [
  { label: 'Triage Agent is scanning', icon: Shield },
  { label: 'Prosecutor & Defender are debating', icon: Gavel },
  { label: 'Judge is finalizing the verdict', icon: Scale },
];

/** Progress UI only; the existing chat hook still owns request state and verdicts. */
export default function DebateLoading() {
  const [stage, setStage] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, stages.length - 1));
    }, 1500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-[85%] rounded-2xl border border-violet-400/20 bg-[#12121A] px-4 py-4 text-[#E8E8F0] shadow-lg shadow-black/10 sm:max-w-md">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
          <Loader2 className={`h-4 w-4 ${reduceMotion ? '' : 'animate-spin'}`} />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-violet-200">Security review in progress</span>
      </div>

      <div className="space-y-2" aria-live="polite" aria-atomic="true">
        {stages.map((item, index) => {
          const Icon = item.icon;
          const active = index === stage;
          const complete = index < stage;
          return (
            <AnimatePresence mode="wait" key={item.label}>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: active ? 1 : complete ? 0.62 : 0.34, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                className="flex min-h-8 items-center gap-2.5 text-sm"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${active ? 'bg-violet-400/15 text-violet-200' : complete ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>
                  {complete ? <Check className="h-3.5 w-3.5" /> : <Icon className={`h-3.5 w-3.5 ${active && !reduceMotion ? 'animate-pulse' : ''}`} />}
                </span>
                <span className={active ? 'text-slate-100' : 'text-slate-400'}>{item.label}{active && <span className="animate-pulse">…</span>}</span>
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
}
