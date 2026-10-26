import { Plus, MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unread?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  return (
    <div className="h-full flex flex-col bg-[#12121A] border-r border-[#2A2A38]">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A38]">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#D946EF] hover:opacity-90 rounded-lg text-white font-medium transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-[#8B8B9E] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#8B8B9E]">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeId === conv.id
                    ? 'bg-[#1A1A24] border border-[#7C3AED]/30'
                    : 'hover:bg-[#1A1A24]'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-[#E8E8F0] text-sm truncate flex-1">
                    {conv.name}
                  </h3>
                  {conv.unread && conv.unread > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-[#7C3AED] text-white text-xs font-medium rounded-full">
                      {conv.unread}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-xs text-[#8B8B9E] truncate">
                    {conv.lastMessage}
                  </p>
                )}
                {conv.timestamp && (
                  <p className="text-xs text-[#8B8B9E] mt-1">
                    {conv.timestamp}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
