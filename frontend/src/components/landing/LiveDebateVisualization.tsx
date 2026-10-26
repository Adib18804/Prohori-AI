import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AgentAvatar from './AgentAvatar';
import TypewriterText from './TypewriterText';
import { CheckCircle, Sword, Shield as ShieldIcon, Scale } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const agents: Agent[] = [
  { id: 'triage', name: 'Triage Agent', emoji: '🔍', color: '#3B82F6' },
  { id: 'prosecutor', name: 'Prosecutor', emoji: '⚔️', color: '#EF4444' },
  { id: 'defender', name: 'Defender', emoji: '🛡️', color: '#10B981' },
  { id: 'judge', name: 'Judge', emoji: '⚖️', color: '#F59E0B' },
];

interface Timeline {
  time: number;
  agentId: string;
  text: string;
  status?: string;
  icon?: any;
}

const timeline: Timeline[] = [
  { time: 500, agentId: 'triage', text: 'Scanning prompt...', status: null, icon: null },
  { time: 1000, agentId: 'triage', text: 'Flagged suspicious — 3 matches', status: 'ANALYZED', icon: CheckCircle },
  {
    time: 2500,
    agentId: 'prosecutor',
    text: "Detected: 'ignore previous', 'reveal system', 'override'",
    status: 'ARGUING',
    icon: Sword,
  },
  {
    time: 4300,
    agentId: 'defender',
    text: 'Could be a stress test. No prior history from user.',
    status: 'DEFENDING',
    icon: ShieldIcon,
  },
  { time: 5800, agentId: 'judge', text: 'Weighing both arguments...', status: 'DELIBERATING', icon: Scale },
];

export default function LiveDebateVisualization() {
  const [cycleTime, setCycleTime] = useState(0);
  const [messages, setMessages] = useState<Record<string, { text: string; status?: string; icon?: any }>>({});
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);

  useEffect(() => {
    const CYCLE_DURATION = 9000;
    let startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentTime = elapsed % CYCLE_DURATION;
      setCycleTime(currentTime);

      // Reset at start
      if (currentTime < 50) {
        setMessages({});
        setActiveAgent('triage');
        setShowVerdict(false);
        return;
      }

      // Process timeline
      const newMessages: Record<string, { text: string; status?: string; icon?: any }> = {};
      let currentActive: string | null = null;

      for (const item of timeline) {
        if (currentTime >= item.time) {
          newMessages[item.agentId] = {
            text: item.text,
            status: item.status || undefined,
            icon: item.icon,
          };
          currentActive = item.agentId;
        }
      }

      setMessages(newMessages);
      setActiveAgent(currentActive);

      // Show verdict
      if (currentTime >= 6800 && currentTime < 8500) {
        setShowVerdict(true);
      } else if (currentTime >= 8500) {
        setShowVerdict(false);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="rounded-2xl border border-border-strong bg-surface p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet/10 to-transparent pointer-events-none" />

        {/* Live indicator */}
        <div className="relative flex items-center gap-2 mb-6">
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[11px] font-mono font-semibold tracking-widest text-text-secondary uppercase">
            Live
          </span>
        </div>

        {/* Agent Cards */}
        <div className="relative space-y-4">
          {agents.map((agent, index) => {
            const message = messages[agent.id];
            const isActive = activeAgent === agent.id;

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-border-base bg-elevated p-4 min-h-[90px] relative"
              >
                <div className="flex items-start gap-3">
                  <AgentAvatar emoji={agent.emoji} color={agent.color} isActive={isActive} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm" style={{ color: agent.color }}>
                        {agent.name}
                      </h4>
                      {message?.status && (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted px-2 py-1 rounded-full bg-surface border border-border-subtle">
                          {message.icon && <message.icon className="w-3 h-3" />}
                          {message.status}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-text-primary leading-relaxed">
                      {message ? (
                        <TypewriterText text={message.text} speed={20} shouldStart={isActive || message.text.length < 30} />
                      ) : (
                        <span className="text-text-muted">Waiting...</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Verdict Card */}
        <AnimatePresence>
          {showVerdict && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="mt-4 p-4 rounded-xl border-2 border-red-500 bg-red-500/10 relative"
              style={{
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
              }}
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🚫</div>
                  <div className="flex-1">
                    <div className="font-bold text-red-400 mb-2">BLOCKED</div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-text-secondary">Confidence:</span>
                      <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                          initial={{ width: 0 }}
                          animate={{ width: '98%' }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">98%</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Classic prompt injection. Evidence found in 3 patterns. Failing closed.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat input mockup */}
      <div className="mt-6">
        <div className="rounded-lg bg-elevated border border-border-base px-4 py-3 flex items-center gap-3 hover:border-violet/50 transition-colors cursor-pointer group">
          <input
            type="text"
            placeholder="Try it yourself →"
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none pointer-events-none"
            readOnly
          />
          <motion.div
            className="text-violet opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ x: 3 }}
          >
            →
          </motion.div>
        </div>
      </div>
    </div>
  );
}
