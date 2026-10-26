import { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unread?: number;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Initialize with a default conversation
    const defaultConv: Conversation = {
      id: 'default-' + Date.now(),
      name: 'New Conversation',
      timestamp: new Date().toLocaleTimeString(),
    };
    setConversations([defaultConv]);
    setActiveId(defaultConv.id);
  }, []);

  const createConversation = () => {
    const newConv: Conversation = {
      id: 'conv-' + Date.now(),
      name: 'New Conversation',
      timestamp: new Date().toLocaleTimeString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    return newConv.id;
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
  };

  return {
    conversations,
    activeId,
    createConversation,
    selectConversation,
  };
}
