import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Check } from 'lucide-react';
import LiveDebateVisualization from './LiveDebateVisualization';
import GradientOrb from './GradientOrb';
import FloatingParticles from './FloatingParticles';

export default function Hero() {
  const navigate = useNavigate();

  const microFeatures = [
    'No credit card required',
    '5 free uses',
    '2-min setup',
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 lg:py-32 overflow-hidden bg-void">
      {/* Decorative Background */}
      <GradientOrb className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" color="violet" size={500} opacity={0.4} />
      <GradientOrb className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" color="magenta" size={400} opacity={0.3} />
      <FloatingParticles count={40} />
      <div className="absolute inset-0 fine-grid" />

      <div className="relative max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* LEFT COLUMN */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 z-10"
        >
          {/* Badge */}
          <motion.button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet bg-violet/10 text-sm font-medium text-text-primary hover:bg-violet/20 hover:border-violet hover:shadow-glow-sm transition-all group focus-ring-premium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-violet"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span>Multi-Agent Debate Live</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>

          {/* Headline */}
          <div>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
              {['Every', 'Prompt', 'Defended.'].map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="inline-block mr-3"
                >
                  {word}
                </motion.span>
              ))}
              <br />
              {['Every', 'Verdict', 'Explained.'].map((word, i) => (
                <motion.span
                  key={i + 3}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i + 3) * 0.1, duration: 0.6 }}
                  className={`inline-block mr-3 ${i === 2 ? 'gradient-text' : ''}`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
          </div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-xl text-text-secondary leading-relaxed max-w-xl"
          >
            Prohori AI is the multi-agent security layer that runs an adversarial debate on every prompt — so compliance
            teams, regulators, and engineers can finally see <span className="text-text-primary font-semibold">WHY</span>{' '}
            a decision was made.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <motion.button
              onClick={() => navigate('/login')}
              className="h-14 px-8 rounded-lg font-semibold text-white bg-gradient-to-r from-violet to-magenta shadow-glow hover:shadow-glow-accent transition-shadow focus-ring-premium flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Get Started — Free</span>
              <motion.div whileHover={{ x: 3 }}>
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>
            <motion.button
              onClick={() => {
                const demoSection = document.querySelector('#live-demo');
                if (demoSection) {
                  demoSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="h-14 px-8 rounded-lg font-semibold text-text-primary border border-border-strong hover:border-violet/50 hover:bg-surface transition-all focus-ring-premium flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlayCircle className="w-5 h-5" />
              <span>Watch Demo</span>
            </motion.button>
          </motion.div>

          {/* Micro Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted"
          >
            {microFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>{feature}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: Live Debate */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="z-10"
        >
          <LiveDebateVisualization />
        </motion.div>
      </div>
    </section>
  );
}
