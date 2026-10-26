import { Menu, MoreVertical, Sidebar } from 'lucide-react';

interface ChatHeaderProps {
  conversationName?: string;
  onMenuClick: () => void;
  onToggleDebate?: () => void;
  onToggleMobileDebate?: () => void;
  showDebatePanel?: boolean;
}

export default function ChatHeader({
  conversationName = 'New Conversation',
  onMenuClick,
  onToggleDebate,
  onToggleMobileDebate,
  showDebatePanel = false,
}: ChatHeaderProps) {
  return (
    <header className="h-16 border-b border-[#2A2A38] bg-[#12121A] flex items-center justify-between px-4">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#1A1A24] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-[#8B8B9E]" />
        </button>
        <div className="min-w-0">
          <h1 className="max-w-[40vw] truncate font-semibold text-[#E8E8F0] sm:max-w-none">{conversationName}</h1>
          <p className="text-xs text-[#8B8B9E]">Protected by Prohori AI</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {onToggleMobileDebate && <button type="button" onClick={onToggleMobileDebate} className="flex h-11 items-center gap-2 rounded-lg px-3 text-xs font-medium text-[#C4B5FD] hover:bg-[#1A1A24] md:hidden" aria-label="Open security analysis"><Sidebar className="h-4 w-4" /><span>Analysis</span></button>}
        {onToggleDebate && (
          <button
            onClick={onToggleDebate}
            className={`hidden min-h-11 md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              showDebatePanel
                ? 'bg-[#7C3AED]/20 text-[#D946EF] border border-[#7C3AED]/30'
                : 'bg-[#1A1A24] text-[#8B8B9E] hover:text-[#E8E8F0]'
            }`}
          >
            <Sidebar className="w-4 h-4" />
            <span>Debate Panel</span>
          </button>
        )}
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#1A1A24]"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-[#8B8B9E]" />
        </button>
      </div>
    </header>
  );
}
