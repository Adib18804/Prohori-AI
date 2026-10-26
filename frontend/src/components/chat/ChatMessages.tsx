import { useEffect, useRef } from 'react';
import { Bot, User as UserIcon } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping?: boolean;
}

export default function ChatMessages({ messages, isTyping = false }: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-3 sm:space-y-6 sm:p-4">
      {messages.length === 0 && !isTyping && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#7C3AED] to-[#D946EF] rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#E8E8F0] mb-2">
              Start a Secure Conversation
            </h2>
            <p className="text-sm text-[#8B8B9E] max-w-md">
              Every message is analyzed by our multi-agent security system to protect against
              prompt injection, jailbreaks, and data exfiltration attempts.
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#D946EF] flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}

          <div
            className={`max-w-[85%] rounded-2xl px-3 py-3 sm:max-w-[70%] sm:px-4 ${
              message.role === 'user'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white'
                : 'bg-[#12121A] border border-[#2A2A38] text-[#E8E8F0]'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
            {message.timestamp && (
              <p
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-[#8B8B9E]'
                }`}
              >
                {message.timestamp}
              </p>
            )}
          </div>

          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-5 h-5 text-[#8B8B9E]" />
            </div>
          )}
        </div>
      ))}

      {isTyping && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#D946EF] flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="bg-[#12121A] border border-[#2A2A38] rounded-2xl px-4 py-3">
            <TypingIndicator />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
