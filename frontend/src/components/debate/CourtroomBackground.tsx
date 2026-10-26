import { motion } from 'framer-motion';

export function CourtroomBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.05]">
      <motion.div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-accent blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -60, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
