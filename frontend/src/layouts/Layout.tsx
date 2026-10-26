import { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, ShieldCheck, LayoutDashboard, AlertTriangle, Settings, LogOut, MessagesSquare, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
  const { isAuthenticated, isAdmin, isSuperAdmin, logout, user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isChatRoute = location.pathname === '/chat';

  useEffect(() => setMenuOpen(false), [location.pathname]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  const navigation = [
    { name: 'Protected Chat', href: '/chat', icon: MessagesSquare },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: true },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
    { name: 'Admin Panel', href: '/admin', icon: ShieldCheck, superAdminOnly: true },
  ];
  const isActive = (href: string) => href === '/chat'
    ? location.pathname === '/chat' || location.pathname === '/protected-chat'
    : location.pathname.startsWith(href);

  const Sidebar = (
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface/95 backdrop-blur md:w-60 md:flex-shrink-0 md:bg-surface/60">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link to="/chat" className="group flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <div className="rounded-lg accent-gradient p-2 shadow-glow-sm transition-shadow group-hover:shadow-glow"><Shield className="h-5 w-5 text-white" /></div>
          <span><span className="block text-sm font-bold leading-tight tracking-tight">Prohori AI</span><span className="text-[11px] text-muted-foreground">Security Gateway</span></span>
        </Link>
        <button type="button" onClick={() => setMenuOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 md:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          if (item.superAdminOnly && !isSuperAdmin) return null;
          const Icon = item.icon;
          const active = isActive(item.href);
          return <Link key={item.name} to={item.href} onClick={() => setMenuOpen(false)} className={cn(
            'flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
            active ? 'border-primary/25 bg-primary/15 text-primary' : 'border-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground',
          )}>
            <Icon className="h-4 w-4 shrink-0" /><span>{item.name}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
          </Link>;
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full accent-gradient text-xs font-bold text-white">{user?.username?.[0]?.toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium">{user?.username}</p><p className="text-[11px] capitalize text-muted-foreground">{user?.role}</p></div>
          </div>
          <button type="button" onClick={logout} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger/10 hover:text-danger" title="Logout" aria-label="Logout"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </aside>
  );

  return <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-background">
    <div className="hidden md:flex md:h-full">{Sidebar}</div>
    {menuOpen && <div className="fixed inset-0 z-50 md:hidden" role="presentation">
      <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">{Sidebar}</div>
    </div>}

    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur md:hidden">
        <Link to="/chat" className="flex items-center gap-2"><span className="rounded-lg accent-gradient p-1.5"><Shield className="h-4 w-4 text-white" /></span><span className="text-sm font-semibold">Prohori AI</span></Link>
        <button type="button" onClick={() => setMenuOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
      </header>
      <main className={`relative min-h-0 min-w-0 flex-1 overflow-x-hidden ${isChatRoute ? 'overflow-hidden' : 'overflow-y-auto'}`}><Outlet /></main>
    </div>
  </div>;
}
