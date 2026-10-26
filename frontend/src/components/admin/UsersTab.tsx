import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Eye, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Trash2, 
  RefreshCw, 
  Shield, 
  Crown,
  CreditCard,
  User as UserIcon,
  Filter
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import UserDetailModal from './UserDetailModal';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  plan_code: string;
  free_uses_used: number;
  free_uses_limit: number;
  monthly_debate_count: number;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function UsersTab() {
  const { token, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected user for modal / actions
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [planModalUser, setPlanModalUser] = useState<User | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [page, planFilter, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (planFilter) params.append('plan', planFilter);
      if (statusFilter !== '') params.append('is_active', statusFilter);
      if (search) params.append('q', search);

      const res = await fetch(`/api/v1/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.statusText}`);
      }

      const data = await res.json();
      let filtered = data.users || [];
      if (roleFilter) {
        filtered = filtered.filter((u: User) => u.role === roleFilter);
      }
      setUsers(filtered);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (res.ok) {
        loadUsers();
        setActiveMenuId(null);
      }
    } catch (e) {
      console.error('Failed to toggle user status', e);
    }
  };

  const handleChangePlan = async (userId: string, newPlan: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_code: newPlan }),
      });
      if (res.ok) {
        setPlanModalUser(null);
        loadUsers();
      }
    } catch (e) {
      console.error('Failed to update plan', e);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setRoleModalUser(null);
        loadUsers();
      }
    } catch (e) {
      console.error('Failed to update role', e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadUsers();
        setActiveMenuId(null);
      }
    } catch (e) {
      console.error('Failed to delete user', e);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-[#12121A] border border-[#2A2A38] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8B8B9E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by email or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-sm text-[#E8E8F0] placeholder-[#8B8B9E]/60 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
            aria-label="Search users"
          />
        </form>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-xs text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED]"
            aria-label="Filter by plan"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="student_weekly">Student Weekly</option>
            <option value="student_monthly">Student Monthly</option>
            <option value="student_yearly">Student Yearly</option>
            <option value="pro_weekly">Pro Weekly</option>
            <option value="pro_monthly">Pro Monthly</option>
            <option value="pro_yearly">Pro Yearly</option>
            <option value="business_monthly">Business Monthly</option>
            <option value="business_yearly">Business Yearly</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-xs text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED]"
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-xs text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED]"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Suspended</option>
          </select>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 rounded-xl bg-[#1A1A24] hover:bg-[#2A2A38] border border-[#2A2A38] text-[#8B8B9E] hover:text-white transition-all disabled:opacity-50"
            title="Refresh list"
            aria-label="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7C3AED]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl bg-[#12121A] border border-[#2A2A38] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#1A1A24] border-b border-[#2A2A38]">
              <TableRow className="border-b border-[#2A2A38]">
                <TableHead className="w-12 text-[#8B8B9E] font-mono text-xs">User</TableHead>
                <TableHead className="text-[#8B8B9E] font-mono text-xs">Email</TableHead>
                <TableHead className="text-[#8B8B9E] font-mono text-xs">Role</TableHead>
                <TableHead className="text-[#8B8B9E] font-mono text-xs">Plan Tier</TableHead>
                <TableHead className="text-[#8B8B9E] font-mono text-xs text-right">Debates</TableHead>
                <TableHead className="text-[#8B8B9E] font-mono text-xs">Sign Up</TableHead>
                <TableHead className="text-[#8B8B9E] font-mono text-xs">Last Active</TableHead>
                <TableHead className="text-[#8B8B9E] font-mono text-xs text-center">Status</TableHead>
                <TableHead className="text-right text-[#8B8B9E] font-mono text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-[#2A2A38]">
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-[#8B8B9E] text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#7C3AED]" />
                    <span>Loading directory records...</span>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-[#8B8B9E] text-xs">
                    <UserX className="w-6 h-6 mx-auto mb-2 text-[#8B8B9E]/50" />
                    <span>No users match the given criteria.</span>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-[#1A1A24]/50 transition-colors">
                    {/* User Avatar + Username */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center font-bold text-xs text-[#E8E8F0]">
                          {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="font-semibold text-white text-xs truncate max-w-[120px]">{u.username}</span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-xs text-[#8B8B9E] font-mono">{u.email}</TableCell>

                    {/* Role */}
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        u.role === 'super_admin' ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#D946EF]' :
                        u.role === 'admin' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                        'bg-gray-500/10 border-gray-500/20 text-[#8B8B9E]'
                      }`}>
                        {u.role === 'super_admin' && <Crown className="w-2.5 h-2.5" />}
                        {u.role}
                      </span>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <span className="text-xs font-semibold text-[#D946EF] uppercase font-mono">
                        {u.plan_code || 'free'}
                      </span>
                    </TableCell>

                    {/* Debates count */}
                    <TableCell className="text-right text-xs font-mono font-medium text-[#E8E8F0]">
                      {u.monthly_debate_count || 0}
                    </TableCell>

                    {/* Signup */}
                    <TableCell className="text-xs text-[#8B8B9E] font-mono">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>

                    {/* Last active */}
                    <TableCell className="text-xs text-[#8B8B9E] font-mono">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'}`} />
                    </TableCell>

                    {/* Actions Dropdown */}
                    <TableCell className="text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedUser(u); setDetailModalOpen(true); }}
                          className="p-1.5 rounded-lg text-[#8B8B9E] hover:text-white hover:bg-[#1A1A24] transition-colors"
                          title="View user details"
                          aria-label={`View details for ${u.username}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                            className="p-1.5 rounded-lg text-[#8B8B9E] hover:text-white hover:bg-[#1A1A24] transition-colors"
                            aria-label={`Actions for ${u.username}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === u.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-[#12121A] border border-[#2A2A38] rounded-xl shadow-2xl py-1 z-30 text-xs">
                              <button
                                onClick={() => { setPlanModalUser(u); setActiveMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[#E8E8F0] hover:bg-[#1A1A24] flex items-center gap-2"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-[#D946EF]" />
                                <span>Change Plan</span>
                              </button>

                              {isSuperAdmin && (
                                <button
                                  onClick={() => { setRoleModalUser(u); setActiveMenuId(null); }}
                                  className="w-full px-3 py-2 text-left text-[#E8E8F0] hover:bg-[#1A1A24] flex items-center gap-2"
                                >
                                  <Shield className="w-3.5 h-3.5 text-[#7C3AED]" />
                                  <span>Change Role</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleToggleStatus(u)}
                                className="w-full px-3 py-2 text-left text-[#E8E8F0] hover:bg-[#1A1A24] flex items-center gap-2"
                              >
                                {u.is_active ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Suspend User</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Reactivate</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete User</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-[#1A1A24]/40 border-t border-[#2A2A38] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8B8B9E]">
          <div>
            Showing <strong className="text-white">{users.length}</strong> of <strong className="text-white">{total}</strong> total users
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-[#12121A] border border-[#2A2A38] text-[#8B8B9E] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-[#12121A] border border-[#2A2A38] text-[#8B8B9E] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail & Violation History Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedUser(null); }}
      />

      {/* Change Plan Dialog */}
      {planModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPlanModalUser(null)} />
          <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A38] rounded-2xl p-6 z-10 text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Change Plan for {planModalUser.username}</h3>
            <p className="text-[#8B8B9E] mb-4">Select the new billing plan subscription tier:</p>
            <div className="space-y-2">
              {[
                { code: 'free', label: 'Free ($0)' },
                { code: 'student_monthly', label: 'Student Monthly ($7.99)' },
                { code: 'pro_monthly', label: 'Pro Monthly ($29)' },
                { code: 'pro_yearly', label: 'Pro Yearly ($249)' },
                { code: 'business_monthly', label: 'Business Monthly ($149)' },
                { code: 'enterprise', label: 'Enterprise (Custom)' }
              ].map((tier) => (
                <button
                  key={tier.code}
                  onClick={() => handleChangePlan(planModalUser.id, tier.code)}
                  className={`w-full p-2.5 rounded-xl border text-left font-medium transition-all ${
                    planModalUser.plan_code === tier.code
                      ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                      : 'bg-[#1A1A24] border-[#2A2A38] text-[#8B8B9E] hover:text-white hover:border-[#7C3AED]/50'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPlanModalUser(null)}
              className="mt-4 w-full py-2 rounded-xl bg-[#1A1A24] text-[#8B8B9E] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Change Role Dialog (Super Admin only) */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setRoleModalUser(null)} />
          <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A38] rounded-2xl p-6 z-10 text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Change Role for {roleModalUser.username}</h3>
            <p className="text-[#8B8B9E] mb-4">Assign elevated administrative access:</p>
            <div className="space-y-2">
              {['user', 'admin', 'super_admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleChangeRole(roleModalUser.id, role)}
                  className={`w-full p-2.5 rounded-xl border text-left font-medium capitalize transition-all ${
                    roleModalUser.role === role
                      ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                      : 'bg-[#1A1A24] border-[#2A2A38] text-[#8B8B9E] hover:text-white hover:border-[#7C3AED]/50'
                  }`}
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setRoleModalUser(null)}
              className="mt-4 w-full py-2 rounded-xl bg-[#1A1A24] text-[#8B8B9E] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
