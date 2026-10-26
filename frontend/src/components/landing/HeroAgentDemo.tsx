import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AgentAvatar from './AgentAvatar';
import TypewriterText from './TypewriterText';

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

interface AgentMessage {
  agentId: string;
  text: string;
  delay: number;
}

const timeline: AgentMessage[] = [
  { agentId: 'triage', text: '🔍 Analyzing prompt...', delay: 600 },
  { agentId: 'triage', text: 'Flagged as suspicious — routing to debate', delay: 1800 },
  { agentId: 'prosecutor', text: '⚔️ Building malicious case...', delay: 2800 },
  {
    agentId: 'prosecutor',
    text: "Detected 3 prompt-injection patterns: 'ignore previous instructions', 'reveal system prompt', 'override safety'",
    delay: 3800,
  },
  { agentId: 'defender', text: '🛡️ Finding counter-arguments...', delay: 4800 },
  {
    agentId: 'defender',
    text: 'Could be a legitimate stress test. No prior history from this user.',
    delay: 5500,
  },
  { agentId: 'judge', text: '⚖️ Weighing both arguments...', delay: 6300 },
];

export default function HeroAgentDemo() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [showVerdict, setShowVerdict] = useState(false);
  const [cycleTime, setCycleTime] = useState(0);

  useEffect(() => {
    const CYCLE_DURATION = 8000;
    let startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentCycleTime = elapsed % CYCLE_DURATION;
      setCycleTime(currentCycleTime);

      // Reset at start of each cycle
      if (currentCycleTime < 50) {
        setMessages({});
        setActiveAgent('triage');
        setShowVerdict(false);
        return;
      }

      // Show dots at start
      if (currentCycleTime < 600) {
        setActiveAgent('triage');
        setMessages({ triage: '...' });
        return;
      }

      // Process timeline
      let activeNow: string | null = null;
      const newMessages: Record<string, string> = {};

      for (const msg of timeline) {
        if (currentCycleTime >= msg.delay) {
          newMessages[msg.agentId] = msg.text;
          activeNow = msg.agentId;
        }
      }

      setMessages(newMessages);
      setActiveAgent(activeNow);

      // Show verdict
      if (currentCycleTime >= 6300 && currentCycleTime < 7500) {
        setShowVerdict(true);
      } else if (currentCycleTime >= 7500) {
        setShowVerdict(false);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="rounded-2xl bg-[#12121A] border border-[#2A2A38] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-sm font-semibold text-[#E8E8F0]">LIVE DEBATE</span>
        </div>

        {/* Agent Cards */}
        <div className="space-y-4">
          {agents.map((agent) => {
            const message = messages[agent.id];
            const isActive = activeAgent === agent.id;

            return (
              <motion.div
                key={agent.id}
                className="p-4 rounded-xl bg-[#1A1A24] border border-[#2A2A38] min-h-[100px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <AgentAvatar emoji={agent.emoji} color={agent.color} isActive={isActive} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm" style={{ color: agent.color }}>
                        {agent.name}
                      </h4>
                      {isActive && (
                        <span className="text-xs text-[#8B8B9E] px-2 py-1 rounded-full bg-[#2A2A38]">Active</span>
                      )}
                    </div>
                    <div className="text-sm text-[#E8E8F0] leading-relaxed">
                      {message ? (
                        <TypewriterText
                          text={message}
                          speed={20}
                          shouldStart={isActive || message.length < 30}
                          className="block"
                        />
                      ) : (
                        <span className="text-[#8B8B9E]">Waiting...</span>
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
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 rounded-xl border-2 border-red-500 bg-red-500/10"
              style={{
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🚫</span>
                    <span className="font-bold text-red-400">VERDICT: BLOCKED</span>
                  </div>
                  <div className="text-sm text-[#E8E8F0] mb-2">Confidence: 98%</div>
                  <button className="text-xs text-[#8B8B9E] hover:text-[#E8E8F0] transition-colors underline">
                    View reasoning →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Try Prompt Input */}
      <div className="mt-6 space-y-3">
        <div className="rounded-lg bg-[#1A1A24] border border-[#2A2A38] px-4 py-3">
          <input
            type="text"
            placeholder="Try a prompt..."
            className="w-full bg-transparent text-[#E8E8F0] placeholder:text-[#8B8B9E] outline-none"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
