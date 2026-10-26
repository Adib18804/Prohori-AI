import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Search, Bell, ArrowLeft } from 'lucide-react';

interface AdminTopBarProps {
  onMenuClick: () => void;
}

export default function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getBreadcrumb = () => {
    const path = location.pathname.split('/').filter(Boolean);
    if (path.length === 1) return 'Overview';
    return path[path.length - 1].charAt(0).toUpperCase() + path[path.length - 1].slice(1);
  };

  const formatTime = (date: Date) => {
    return date.toUTCString().replace('GMT', 'UTC');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-[#2A2A38] bg-[#12121A] px-3 sm:h-20 sm:gap-4 sm:px-6 lg:gap-6">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#1A1A24] md:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-[#8B8B9E]" />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[#8B8B9E] mb-1">Admin Panel</div>
        <h1 className="truncate text-base font-semibold text-[#E8E8F0] sm:text-xl">
          {getBreadcrumb()}
        </h1>
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B9E]" />
          <input
            type="text"
            placeholder="Search... (⌘K)"
            className="w-full pl-10 pr-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-sm text-[#E8E8F0] placeholder-[#8B8B9E] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {/* UTC Clock */}
        <div className="hidden xl:block text-xs text-[#8B8B9E] font-mono">
          {formatTime(currentTime)}
        </div>

        {/* Notifications */}
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-[#1A1A24]"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-[#8B8B9E]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full"></span>
        </button>

        {/* Back to Chat */}
        <Link
          to="/chat"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </Link>
      </div>
    </header>
  );
}
