import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface AdminGuardProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AdminGuard({ children, requireSuperAdmin = false }: AdminGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  const isSuperAdmin = user.role === 'super_admin';

  if (!isAdmin || (requireSuperAdmin && !isSuperAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
