import { useTypewriter } from '@/hooks/useTypewriter';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  shouldStart: boolean;
  className?: string;
}

export default function TypewriterText({ text, speed = 30, shouldStart, className = '' }: TypewriterTextProps) {
  const { displayedText } = useTypewriter(text, speed, shouldStart);

  return <span className={className}>{displayedText}</span>;
}
