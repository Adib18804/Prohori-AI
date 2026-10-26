import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';

import './App.css';

// Pages
import ProtectedChat from '@/pages/ProtectedChat';
import Dashboard from '@/pages/Dashboard';
import AdminPanel from '@/pages/AdminPanel';
import IncidentViewer from '@/pages/IncidentViewer';
import AttackMemory from '@/pages/AttackMemory';
import AuditReport from '@/pages/AuditReport';
import Settings from '@/pages/Settings';
import DebateTranscriptPage from '@/pages/DebateTranscript';
import Login from '@/pages/Login';
import Chat from '@/pages/Chat';
import Pricing from '@/pages/Pricing';
import Billing from '@/pages/Billing';
import Landing from '@/pages/Landing';
import LandingOrDashboard from '@/pages/LandingOrDashboard';

// Admin Layout & Components
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHome from '@/pages/admin/AdminHome';
import UsersTab from '@/pages/admin/UsersTab';
import RevenueTab from '@/pages/admin/RevenueTab';
import RequestsTab from '@/pages/admin/RequestsTab';
import AttacksTab from '@/pages/admin/AttacksTab';
import SystemTab from '@/pages/admin/SystemTab';
import SettingsTab from '@/pages/admin/SettingsTab';

// Layout
import Layout from '@/layouts/Layout';

// Auth context
import { AuthProvider } from '@/contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingOrDashboard />} />
              <Route path="/login" element={<Login />} />

              {/* Dedicated Super Admin Control Room */}
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                }
              >
                <Route index element={<AdminHome />} />
                <Route path="users" element={<UsersTab />} />
                <Route path="revenue" element={<RevenueTab />} />
                <Route path="requests" element={<RequestsTab />} />
                <Route path="attacks" element={<AttacksTab />} />
                <Route path="system" element={<SystemTab />} />
                <Route
                  path="settings"
                  element={
                    <AdminGuard requireSuperAdmin={true}>
                      <SettingsTab />
                    </AdminGuard>
                  }
                />
              </Route>

              {/* User Application Routes - All require authentication via Layout */}
              <Route element={<Layout />}>
                <Route path="chat" element={<Chat />} />
                <Route path="protected-chat" element={<ProtectedChat />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="billing" element={<Billing />} />
                <Route path="incidents" element={<IncidentViewer />} />
                <Route path="incidents/:id" element={<IncidentViewer />} />
                <Route path="debates/:id" element={<DebateTranscriptPage />} />
                <Route path="memory" element={<AttackMemory />} />
                <Route path="audit" element={<AuditReport />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;