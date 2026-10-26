import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  Shield,
  Zap,
  FileText,
  Database,
  GitBranch,
  Clock,
  ArrowRight,
  Check,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';
import HeroAgentDemo from '@/components/landing/HeroAgentDemo';
import AnimatedCounter from '@/components/landing/AnimatedCounter';

export default function Landing() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#E8E8F0]">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: HERO */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="flex min-h-[calc(100dvh-2rem)] items-center justify-center px-4 py-10 sm:min-h-screen sm:px-6 sm:py-12">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* LEFT COLUMN */}
          <motion.div {...fadeInUp} className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7C3AED] bg-[#7C3AED]/10 text-sm">
              <span>🛡️</span>
              <span>Protected by Multi-Agent Debate</span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="mb-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Every Prompt Defended.
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #7C3AED, #D946EF)',
                  }}
                >
                  Every Verdict Explained.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#8B8B9E] sm:text-xl">
                The multi-agent security layer that explains WHY a prompt was blocked — in plain English a compliance
                officer can read.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <motion.button
                onClick={() => navigate('/login')}
                className="min-h-11 rounded-lg px-6 py-3 font-semibold text-white sm:px-8 sm:py-4"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #7C3AED, #D946EF)',
                }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(124, 58, 237, 0.5)' }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started <ArrowRight className="inline w-5 h-5 ml-2" />
              </motion.button>
              <motion.button
                onClick={() => navigate('/login')}
                className="min-h-11 rounded-lg border border-[#2A2A38] bg-transparent px-6 py-3 font-semibold transition-colors hover:bg-[#1A1A24] sm:px-8 sm:py-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.button>
            </div>

            {/* Trust Row */}
            <p className="text-sm text-[#8B8B9E]">Built for fintech · health · gov · e-commerce</p>
          </motion.div>

          {/* RIGHT COLUMN: Live Demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <HeroAgentDemo />
            <div className="mt-6 text-center">
              <motion.button
                onClick={() => navigate('/chat')}
                className="px-6 py-3 rounded-lg font-medium text-[#7C3AED] border border-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Try it yourself <ArrowRight className="inline w-4 h-4 ml-1" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 2: PROBLEM */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Section>
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <Label>THE PROBLEM</Label>
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">The #1 LLM Security Risk in 2026</h2>
          <p className="text-lg text-[#8B8B9E] leading-relaxed max-w-2xl mx-auto">
            Prompt injection, jailbreak attacks, and data leaks are the top threat to every LLM application. Existing
            filters give you a single opaque score — no explanation, no audit trail, no trust. Compliance teams can't
            see WHY a decision was made.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <StatCard value={500} suffix="M+" label="attacks in 2025" />
          <StatCard value={87} suffix="%" label="of LLM apps vulnerable" />
          <StatCard value={4.5} suffix="M" label="average breach cost" prefix="$" />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 3: SOLUTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Section>
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <Label>THE SOLUTION</Label>
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Introducing the AI Debate Firewall</h2>
          <p className="text-lg text-[#8B8B9E] leading-relaxed max-w-2xl mx-auto">
            Instead of one classifier, we put four AI agents into a structured debate. Every verdict ships with a
            plain-English rationale.
          </p>
        </div>

        {/* Prosecutor vs Defender */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
          <motion.div
            className="p-6 rounded-2xl bg-[#12121A] border border-[#EF4444]/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl mb-4">🔴</div>
            <h3 className="text-xl font-bold mb-2 text-[#EF4444]">Prosecutor</h3>
            <p className="text-[#8B8B9E]">"This prompt is malicious"</p>
          </motion.div>

          <div className="text-center">
            <motion.div
              className="inline-flex items-center gap-4 text-2xl font-bold"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="text-yellow-400" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EF4444] to-[#10B981]">VS</span>
              <Zap className="text-yellow-400" />
            </motion.div>
          </div>

          <motion.div
            className="p-6 rounded-2xl bg-[#12121A] border border-[#10B981]/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl mb-4">🟢</div>
            <h3 className="text-xl font-bold mb-2 text-[#10B981]">Defender</h3>
            <p className="text-[#8B8B9E]">"This is benign"</p>
          </motion.div>
        </div>

        {/* Verdict Demo */}
        <motion.div
          className="mt-12 max-w-2xl mx-auto p-6 rounded-2xl border-2 border-[#F59E0B] bg-[#F59E0B]/5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">🟡</div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-[#F59E0B] mb-2">JUDGE VERDICT: BLOCKED</h4>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Confidence: 98%</span>
                </div>
                <div className="h-2 bg-[#2A2A38] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-[#EF4444]"
                    initial={{ width: 0 }}
                    whileInView={{ width: '98%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
              <p className="text-sm text-[#8B8B9E]">
                Rationale: "The prompt attempts to override safety instructions using three known injection patterns..."
              </p>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 4: HOW IT WORKS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Section>
        <div className="text-center max-w-4xl mx-auto space-y-6 mb-16">
          <Label>HOW IT WORKS</Label>
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Four agents. One verdict. Full transparency.</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
          <AgentCard
            emoji="🔵"
            name="Triage Agent"
            color="#3B82F6"
            description="Fast classification: BENIGN, SUSPICIOUS, or MALICIOUS"
            expanded={expandedAgent === 'triage'}
            onClick={() => setExpandedAgent(expandedAgent === 'triage' ? null : 'triage')}
            sampleOutput='{"classification": "SUSPICIOUS", "risk_score": 0.78, "fast_lane": false}'
          />
          <AgentCard
            emoji="🔴"
            name="Prosecutor"
            color="#EF4444"
            description="Builds the case for blocking the prompt"
            expanded={expandedAgent === 'prosecutor'}
            onClick={() => setExpandedAgent(expandedAgent === 'prosecutor' ? null : 'prosecutor')}
            sampleOutput='"Detected 3 matched attack signatures: prompt injection, jailbreak attempt, PII extraction"'
          />
          <AgentCard
            emoji="🟢"
            name="Defender"
            color="#10B981"
            description="Searches for legitimate explanations"
            expanded={expandedAgent === 'defender'}
            onClick={() => setExpandedAgent(expandedAgent === 'defender' ? null : 'defender')}
            sampleOutput='"Could be a legitimate stress test. No prior violation history from this user. Educational context detected."'
          />
          <AgentCard
            emoji="🟡"
            name="Judge"
            color="#F59E0B"
            description="Weighs both sides and delivers the final verdict"
            expanded={expandedAgent === 'judge'}
            onClick={() => setExpandedAgent(expandedAgent === 'judge' ? null : 'judge')}
            sampleOutput='{"verdict": "BLOCK", "confidence": 98, "explanation": "Prosecutor evidence outweighs defense. High risk confirmed."}'
          />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 5: FEATURES GRID */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Section>
        <div className="text-center max-w-4xl mx-auto space-y-6 mb-16">
          <Label>FEATURES</Label>
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Built for real-world security teams</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<FileText />}
            title="Explainable by design"
            description="Every verdict has a rationale you can share with compliance"
          />
          <FeatureCard
            icon={<Database />}
            title="RAG attack memory"
            description="Learns from every attack to improve future detection"
          />
          <FeatureCard
            icon={<Zap />}
            title="Cost-aware routing"
            description="Fast lane for benign traffic, deep analysis for suspicious prompts"
          />
          <FeatureCard
            icon={<Shield />}
            title="Audit-ready"
            description="One-click compliance reports for SOC2, ISO 27001, HIPAA"
          />
          <FeatureCard
            icon={<GitBranch />}
            title="Multi-provider fallback"
            description="Groq + Mistral redundancy for 99.9% uptime"
          />
          <FeatureCard
            icon={<Clock />}
            title="Real-time timeline"
            description="Watch the debate unfold in your dashboard"
          />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 6: PRICING PREVIEW */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Section>
        <div className="text-center max-w-4xl mx-auto space-y-6 mb-12">
          <Label>PRICING</Label>
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Simple, transparent pricing</h2>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="mb-12 flex flex-wrap justify-center gap-2 px-2">
          {(['weekly', 'monthly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`min-h-11 rounded-lg px-4 py-2 font-medium transition-all sm:px-6 ${
                billingCycle === cycle
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-[#12121A] text-[#8B8B9E] hover:bg-[#1A1A24]'
              }`}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              {cycle === 'yearly' && ' — Save 38%'}
            </button>
          ))}
        </div>

        {/* Plan Cards */}
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8">
          <PricingCard
            name="Free"
            price="$0"
            period="forever"
            features={['100 debates/mo', 'Basic analytics', 'Email support', '24hr response time']}
            cta="Start Free"
            onCta={() => navigate('/login')}
          />
          <PricingCard
            name="Student"
            price="$7.99"
            period={billingCycle === 'yearly' ? '/year' : '/mo'}
            features={['2,000 debates/mo', 'Full analytics', 'Priority support', '4hr response time']}
            cta="Choose Plan"
            onCta={() => navigate('/pricing')}
            highlighted
          />
          <PricingCard
            name="Professional"
            price="$29"
            period={billingCycle === 'yearly' ? '/year' : '/mo'}
            features={['20,000 debates/mo', 'Advanced RAG', 'Slack support', '1hr response time']}
            cta="Choose Plan"
            onCta={() => navigate('/pricing')}
          />
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/pricing')}
            className="text-[#7C3AED] hover:underline font-medium"
          >
            See all plans <ArrowRight className="inline w-4 h-4" />
          </button>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 7: CTA + FOOTER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Section>
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold sm:text-5xl lg:text-6xl">
            Start Free — <span className="text-[#10B981]">5 uses</span> included
          </h2>
          <p className="text-xl text-[#8B8B9E]">No credit card required. Cancel anytime.</p>
          <motion.button
            onClick={() => navigate('/login')}
            className="min-h-12 rounded-lg px-8 py-4 text-lg font-bold text-white sm:px-12 sm:py-5 sm:text-xl"
            style={{
              backgroundImage: 'linear-gradient(135deg, #7C3AED, #D946EF)',
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(124, 58, 237, 0.6)' }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started <ArrowRight className="inline w-6 h-6 ml-2" />
          </motion.button>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-[#2A2A38] bg-[#0A0A0F] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[#8B8B9E]">
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-[#8B8B9E]">
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-[#8B8B9E]">
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#E8E8F0] transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Social</h4>
              <div className="flex gap-4">
                <a href="#" className="text-[#8B8B9E] hover:text-[#E8E8F0] transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#8B8B9E] hover:text-[#E8E8F0] transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#8B8B9E] hover:text-[#E8E8F0] transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-[#2A2A38] pt-8 text-center text-sm text-[#8B8B9E]">
            © 2026 Prohori AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function Section({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8 }}
      className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24"
    >
      {children}
    </motion.section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-semibold tracking-wider text-[#8B8B9E] uppercase mb-4">{children}</div>
  );
}

interface StatCardProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

function StatCard({ value, suffix = '', prefix = '', label }: StatCardProps) {
  return (
    <motion.div
      className="p-8 rounded-2xl bg-[#12121A] border border-[#2A2A38]"
      whileHover={{ scale: 1.05, borderColor: '#7C3AED' }}
    >
      <div
      className="mb-2 text-4xl font-bold bg-clip-text text-transparent sm:text-5xl"
        style={{
          backgroundImage: 'linear-gradient(135deg, #7C3AED, #D946EF)',
        }}
      >
        {prefix}
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <div className="text-[#8B8B9E]">{label}</div>
    </motion.div>
  );
}

interface AgentCardProps {
  emoji: string;
  name: string;
  color: string;
  description: string;
  expanded: boolean;
  onClick: () => void;
  sampleOutput: string;
}

function AgentCard({ emoji, name, color, description, expanded, onClick, sampleOutput }: AgentCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className="p-6 rounded-2xl bg-[#12121A] border border-[#2A2A38] cursor-pointer"
      whileHover={{ scale: 1.05, borderColor: color }}
      animate={{ height: expanded ? 'auto' : '200px' }}
    >
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-lg font-bold mb-2" style={{ color }}>
        {name}
      </h3>
      <p className="text-sm text-[#8B8B9E] mb-4">{description}</p>
      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-3 rounded-lg bg-[#0A0A0F] border border-[#2A2A38] text-xs font-mono text-[#10B981] overflow-auto"
        >
          {sampleOutput}
        </motion.div>
      )}
    </motion.div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      className="p-6 rounded-2xl bg-[#12121A] border border-[#2A2A38]"
      whileHover={{
        scale: 1.02,
        borderColor: '#7C3AED',
        boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)',
      }}
    >
      <div className="w-12 h-12 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-[#8B8B9E]">{description}</p>
    </motion.div>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  onCta: () => void;
  highlighted?: boolean;
}

function PricingCard({ name, price, period, features, cta, onCta, highlighted = false }: PricingCardProps) {
  return (
    <motion.div
      className={`p-8 rounded-2xl border ${
        highlighted
          ? 'border-[#7C3AED] bg-[#7C3AED]/5 shadow-[0_0_40px_rgba(124,58,237,0.2)]'
          : 'border-[#2A2A38] bg-[#12121A]'
      }`}
      whileHover={{ scale: 1.05 }}
    >
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-[#8B8B9E]">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <motion.button
        onClick={onCta}
        className={`w-full py-3 rounded-lg font-semibold ${
          highlighted
            ? 'bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white'
            : 'border border-[#2A2A38] hover:bg-[#1A1A24]'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {cta}
      </motion.button>
    </motion.div>
  );
}
