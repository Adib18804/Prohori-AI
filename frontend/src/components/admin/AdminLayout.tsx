import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const tabs = [
    { label: 'Dashboard', to: '/admin', end: true },
    { label: 'Users', to: '/admin/users' },
    { label: 'Revenue', to: '/admin/revenue' },
    { label: 'Requests', to: '/admin/requests' },
    { label: 'Attacks', to: '/admin/attacks' },
    { label: 'System', to: '/admin/system' },
  ];

  return (
    <div className="flex h-[100dvh] min-w-0 overflow-hidden bg-[#0A0A0F]">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />

        <nav aria-label="Admin sections" className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#2A2A38] bg-[#101018] px-2 py-2 [scrollbar-width:none] md:hidden">
          {tabs.map((tab) => {
            const active = tab.end ? location.pathname === tab.to : location.pathname.startsWith(tab.to);
            return <Link key={tab.to} to={tab.to} className={`flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium transition-colors ${active ? 'bg-[#7C3AED]/20 text-white' : 'text-[#8B8B9E] hover:bg-white/5 hover:text-white'}`}>{tab.label}</Link>;
          })}
        </nav>

        {/* Page Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-screen-2xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
