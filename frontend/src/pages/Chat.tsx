import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ConversationList from '@/components/chat/ConversationList';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import DebatePanel from '@/components/chat/DebatePanel';
import WarningCard from '@/components/chat/WarningCard';
import BanCard from '@/components/chat/BanCard';
import { useConversations } from '@/hooks/useConversations';
import { useChat } from '@/hooks/useChat';

export default function Chat() {
  const { user } = useAuth();
  const { conversations, activeId, createConversation, selectConversation } = useConversations();
  const { messages, isLoading, debate, trustStatus, sendMessage, clearTrustStatus } = useChat(activeId);
  const [showConvList, setShowConvList] = useState(false);
  const [showDebatePanel, setShowDebatePanel] = useState(true);
  const [showMobileAnalysis, setShowMobileAnalysis] = useState(false);

  useEffect(() => {
    if (!showConvList && !showMobileAnalysis) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShowConvList(false); setShowMobileAnalysis(false); }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showConvList, showMobileAnalysis]);

  // Check if user is banned
  if (user && trustStatus?.action === 'banned') {
    return (
      <BanCard
        bannedUntil={trustStatus.banned_until || ''}
        reason={trustStatus.reason || 'Security policy violation'}
        hoursLeft={trustStatus.hours_left || 24}
      />
    );
  }

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 overflow-hidden bg-[#0A0A0F]">
      {/* Conversation List */}
      <div
        className={`fixed bottom-0 left-0 top-14 z-50 w-72 max-w-[85vw] transition-transform duration-200 md:top-0 lg:relative lg:z-0 lg:h-full lg:max-w-none lg:translate-x-0 ${showConvList ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:block`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => {
            selectConversation(id);
            setShowConvList(false);
          }}
          onNewChat={() => {
            createConversation();
            setShowConvList(false);
          }}
        />
      </div>

      {/* Mobile Overlay */}
      {showConvList && (
        <div
          className="fixed inset-0 z-40 bg-black/55 lg:hidden"
          aria-hidden="true"
          onClick={() => setShowConvList(false)}
        />
      )}

      {/* Chat Area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatHeader
          conversationName={activeConversation?.name}
          onMenuClick={() => setShowConvList(true)}
          onToggleDebate={() => setShowDebatePanel((prev) => !prev)}
          onToggleMobileDebate={() => setShowMobileAnalysis((prev) => !prev)}
          showDebatePanel={showDebatePanel}
        />

        {/* Warning Card */}
        {trustStatus?.action === 'warning' && (
          <div className="max-h-36 overflow-y-auto p-3 sm:p-4">
            <WarningCard
              warningsCount={trustStatus.warnings_count || 1}
              warningsLeft={trustStatus.warnings_left || 2}
              reason={trustStatus.reason || 'Your message was flagged as potentially malicious'}
              onUnderstood={clearTrustStatus}
            />
          </div>
        )}

        <ChatMessages messages={messages} isTyping={isLoading} />
        
        <ChatInput
          onSend={sendMessage}
          disabled={!!trustStatus && trustStatus.action !== 'ok'}
          isLoading={isLoading}
          placeholder={
            trustStatus?.action === 'warning'
              ? 'Warning active - Be careful with your messages...'
              : 'Type a message...'
          }
        />
      </div>

      {/* Debate Panel */}
      {showDebatePanel && (
        <div className="hidden md:block">
          <DebatePanel debate={debate} isVisible={showDebatePanel} />
        </div>
      )}

      {showMobileAnalysis && <div className="fixed inset-0 z-[60] bg-black/60 p-0 backdrop-blur-sm md:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowMobileAnalysis(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Security analysis" className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-2xl border border-[#2A2A38] bg-[#12121A] pb-[env(safe-area-inset-bottom)] shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#2A2A38] bg-[#12121A]/95 px-4 py-2 backdrop-blur"><span className="text-sm font-semibold text-[#E8E8F0]">Security Analysis</span><button type="button" onClick={() => setShowMobileAnalysis(false)} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#8B8B9E] hover:bg-[#1A1A24]" aria-label="Close security analysis"><X className="h-5 w-5" /></button></div>
          <DebatePanel debate={debate} isVisible={showMobileAnalysis} />
        </section>
      </div>}
    </div>
  );
}
