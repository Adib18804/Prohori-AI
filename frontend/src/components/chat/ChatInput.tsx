import { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 shrink-0 border-t border-[#2A2A38] bg-[#12121A]/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur sm:p-4 sm:pb-4">
      <div className="mx-auto flex w-full max-w-4xl items-end gap-2 sm:gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className="min-w-0 flex-1 rounded-2xl border border-[#2A2A38] bg-[#1A1A24] px-4 py-3 text-[#E8E8F0] shadow-lg shadow-black/10 placeholder-[#8B8B9E] resize-none transition-all focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: '48px', maxHeight: '200px' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = '48px';
            target.style.height = target.scrollHeight + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isLoading}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-[#8B8B9E] sm:text-xs">
        Protected by Prohori AI • All messages are analyzed for security threats
      </p>
    </div>
  );
}
