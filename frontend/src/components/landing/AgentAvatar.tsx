import { motion } from 'framer-motion';

interface AgentAvatarProps {
  emoji: string;
  color: string;
  isActive: boolean;
}

export default function AgentAvatar({ emoji, color, isActive }: AgentAvatarProps) {
  return (
    <motion.div
      className="relative"
      animate={{
        opacity: isActive ? 1 : 0.4,
      }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        style={{
          border: `2px solid ${color}`,
          boxShadow: isActive ? `0 0 0 4px ${color}30` : 'none',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {emoji}
      </div>
    </motion.div>
  );
}
