import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  className?: string;
  maxDurationMs?: number;
}

export function TypewriterText({ text, className, maxDurationMs = 3000 }: TypewriterTextProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const speed = Math.max(8, Math.min(30, maxDurationMs / Math.max(text.length, 1)));
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, maxDurationMs]);

  return (
    <p className={className}>
      {text.slice(0, count)}
      {count < text.length && <span className="animate-pulse text-primary">▍</span>}
    </p>
  );
}
