import { motion } from 'framer-motion';

interface GradientOrbProps {
  className?: string;
  color?: 'violet' | 'magenta';
  size?: number;
  blur?: number;
  opacity?: number;
  animate?: boolean;
}

export default function GradientOrb({
  className = '',
  color = 'violet',
  size = 400,
  blur = 120,
  opacity = 0.4,
  animate = true,
}: GradientOrbProps) {
  const colorMap = {
    violet: 'rgba(124, 58, 237, ' + opacity + ')',
    magenta: 'rgba(217, 70, 239, ' + opacity + ')',
  };

  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${colorMap[color]} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      animate={
        animate
          ? {
              scale: [1, 1.2, 1],
              opacity: [opacity * 0.8, opacity, opacity * 0.8],
            }
          : {}
      }
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
