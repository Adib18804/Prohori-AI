import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ConversationList from '@/components/chat/ConversationList';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import DebatePanel from '@/components/chat/DebatePanel';
import WarningCard from '@/components/chat/WarningCard';
import { useConversations } from '@/hooks/useConversations';
import { useChat } from '@/hooks/useChat';

export default function Chat() {
  const { token } = useAuth();
  const { conversations, activeId, createConversation, selectConversation } = useConversations();
  const { messages, isLoading, debate, trustStatus, sendMessage, clearTrustStatus } = useChat(activeId);
  const [showConvList, setShowConvList] = useState(false);
  const [showDebatePanel, setShowDebatePanel] = useState(true);
  const [showMobileAnalysis, setShowMobileAnalysis] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{ warnings_count: number; banned_until: string | null; ban_reason: string | null } | null>(null);

  // Refresh account-level moderation state so admin actions reach an open chat.
  useEffect(() => {
    if (!token) {
      setAccountStatus(null);
      return;
    }
    let active = true;
    const refreshStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const payload = await response.json();
        const profile = payload.user ?? payload;
        if (!active) return;
        setAccountStatus({
          warnings_count: Number(profile.warnings_count ?? 0),
          banned_until: profile.banned_until ?? null,
          ban_reason: profile.ban_reason ?? null,
        });
      } catch (error) {
        // Keep the last known moderation state if a transient poll fails.
        console.warn('Could not refresh chat moderation status:', error);
      }
    };
    void refreshStatus();
    const timer = window.setInterval(refreshStatus, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [token]);

  useEffect(() => {
    if (!showConvList && !showMobileAnalysis) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShowConvList(false); setShowMobileAnalysis(false); }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showConvList, showMobileAnalysis]);

  // Check if user is banned
  const bannedUntil = accountStatus?.banned_until || trustStatus?.banned_until || null;
  const isCurrentlyBanned = trustStatus?.action === 'banned' || Boolean(bannedUntil && (Number.isNaN(Date.parse(bannedUntil)) || new Date(bannedUntil).getTime() > Date.now()));
  const warningCount = Math.max(accountStatus?.warnings_count ?? 0, trustStatus?.warnings_count ?? 0);
  const warningLimit = 3;

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
        {isCurrentlyBanned ? (
          <div role="alert" className="mx-3 mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300 sm:mx-4">
            <p className="font-semibold">{!bannedUntil || new Date(bannedUntil).getFullYear() >= 9999 ? 'Permanently banned' : 'You are temporarily banned.'}</p>
            <p className="mt-1 break-words text-sm">Reason: {accountStatus?.ban_reason || trustStatus?.reason || 'Security policy violation'}</p>
            {bannedUntil && new Date(bannedUntil).getFullYear() < 9999 && <p className="mt-1 text-sm">Ban expires at: {new Date(bannedUntil).toLocaleString()}</p>}
          </div>
        ) : (trustStatus?.action === 'warning' || warningCount > 0) && (
          <div className="max-h-36 overflow-y-auto p-3 sm:p-4">
            <WarningCard
              warningsCount={warningCount || 1}
              warningsLeft={trustStatus?.warnings_left ?? Math.max(0, warningLimit - warningCount)}
              reason={trustStatus.reason || 'Your message was flagged as potentially malicious'}
              onUnderstood={clearTrustStatus}
            />
          </div>
        )}

        <ChatMessages messages={messages} isTyping={isLoading} />
        
        <ChatInput
          onSend={sendMessage}
          disabled={isCurrentlyBanned || (!!trustStatus && trustStatus.action !== 'ok')}
          isLoading={isLoading}
          placeholder={
            isCurrentlyBanned
              ? 'You are banned. You cannot send messages.'
              : trustStatus?.action === 'warning'
              ? 'Warning active - Be careful with your messages...'
              : 'Type a message...'
          }
        />
      </div>

      {/* Debate Panel */}
      {showDebatePanel && (
        <div className="hidden md:block">
          <DebatePanel isLoading={isLoading} verdict={debate?.verdict?.verdict} riskLevel={debate?.triage?.classification} reason={debate?.verdict?.reason} confidence={debate?.verdict?.confidence} />
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
