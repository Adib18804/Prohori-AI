import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface DebateData {
  triage?: any;
  prosecutor?: any;
  defender?: any;
  verdict?: any;
}

interface TrustStatus {
  action: 'ok' | 'warning' | 'banned';
  warnings_count?: number;
  warnings_left?: number;
  banned_until?: string;
  reason?: string;
  hours_left?: number;
}

export function useChat(sessionId: string) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debate, setDebate] = useState<DebateData | null>(null);
  const [trustStatus, setTrustStatus] = useState<TrustStatus | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!token) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setDebate(null);

      try {
        const response = await fetch('http://localhost:8000/api/v1/protect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: content,
            session_id: sessionId,
            enable_rag: true,
            enable_ml: false,
          }),
        });

        const data = await response.json();

        // Check for trust issues
        if (data.verdict === 'BLOCK') {
          // Could be warning or ban
          const trustCheck: TrustStatus = {
            action: 'warning', // Will be updated by backend in future
            warnings_count: 1, // Mock - should come from backend
            warnings_left: 2,
            reason: data.reason,
          };
          setTrustStatus(trustCheck);
        }

        // Set debate data if available
        if (data.debate_triggered) {
          setDebate({
            triage: {
              classification: data.risk_level || 'UNKNOWN',
              risk_score: data.confidence || 0,
              confidence: data.confidence || 0,
            },
            verdict: {
              verdict: data.verdict,
              confidence: data.confidence,
              reason: data.reason,
            },
          });
        }

        // Add assistant response if available
        if (data.assistant_response) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.assistant_response,
            timestamp: new Date().toLocaleTimeString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else if (data.verdict === 'BLOCK') {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'I cannot process that request due to security concerns. Please rephrase your message.',
            timestamp: new Date().toLocaleTimeString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your message. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [token, sessionId]
  );

  const clearTrustStatus = useCallback(() => {
    setTrustStatus(null);
  }, []);

  return {
    messages,
    isLoading,
    debate,
    trustStatus,
    sendMessage,
    clearTrustStatus,
  };
}
