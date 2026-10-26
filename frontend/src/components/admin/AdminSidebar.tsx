import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Activity,
  Shield,
  Server,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users', end: false },
  { to: '/admin/revenue', icon: DollarSign, label: 'Revenue', end: false },
  { to: '/admin/requests', icon: Activity, label: 'Requests', end: false },
  { to: '/admin/attacks', icon: Shield, label: 'Attacks', end: false },
  { to: '/admin/system', icon: Server, label: 'System', end: false },
  { to: '/admin/settings', icon: Settings, label: 'Settings', end: false },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-72 max-w-[85vw] flex-col border-r border-[#2A2A38] bg-[#12121A] transition-transform duration-300 md:sticky md:w-60 md:max-w-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#2A2A38]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#D946EF] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#E8E8F0]">Prohori AI</div>
              <div className="text-xs text-[#7C3AED] font-medium">ADMIN</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-[#1A1A24] md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-[#8B8B9E]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#7C3AED]/20 to-[#D946EF]/20 text-[#E8E8F0] border border-[#7C3AED]/30'
                      : 'text-[#8B8B9E] hover:bg-[#1A1A24] hover:text-[#E8E8F0]'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Footer */}
        <div className="border-t border-[#2A2A38] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#D946EF] flex items-center justify-center text-white font-semibold">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#E8E8F0] truncate">
                {user?.username}
              </div>
              <div className="text-xs text-[#7C3AED] font-medium">
                {user?.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1A1A24] px-3 py-2 text-sm text-[#8B8B9E] transition-all hover:bg-[#2A2A38] hover:text-[#E8E8F0]"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
