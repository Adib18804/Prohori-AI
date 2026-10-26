import { motion } from 'framer-motion';
import { ShieldCheck, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerdictCard } from './VerdictCard';
import type { ProtectResponse } from '@/services/api';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  verdict?: ProtectResponse;
  timestamp: Date;
}

export function ChatMessage({
  message,
  onViewDebate,
}: {
  message: ChatMessageData;
  onViewDebate: (v: ProtectResponse) => void;
}) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div
          className={cn(
            'w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center border',
            isAssistant
              ? 'bg-primary/15 border-primary/30 text-primary'
              : 'bg-surface-2 border-border text-muted-foreground'
          )}
        >
          {isAssistant ? <Bot className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        </div>
      )}

      <div className={cn('max-w-[75%] space-y-2', isUser && 'items-end')}>
        {isUser ? (
          <div className="accent-gradient text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-glow-sm">
            {message.content}
          </div>
        ) : (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm border',
              isAssistant
                ? 'bg-surface border-border rounded-tl-sm'
                : 'bg-surface-2/60 border-border text-muted-foreground rounded-tl-sm'
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {message.verdict && (
          <VerdictCard
            verdict={message.verdict}
            onViewDebate={() => onViewDebate(message.verdict!)}
          />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center border bg-surface-2 border-border text-muted-foreground">
          <User className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );
}
