export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Security agents are analyzing">
      <span className="mr-1 text-xs text-[#8B8B9E]">Security agents are analyzing</span>
      <div className="w-2 h-2 bg-[#8B8B9E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-[#8B8B9E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-[#8B8B9E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
