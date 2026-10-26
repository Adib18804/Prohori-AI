import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, AlertTriangle, Ban, X, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import UserDetailModal from '@/components/admin/UserDetailModal';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  plan_code: string;
  monthly_debate_count: number;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  warnings_count: number;
  banned_until: string | null;
  ban_reason: string | null;
  total_violations: number;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface BanModalState {
  open: boolean;
  user: User | null;
}

// ─── Helper: is the user currently banned? ───────────────────────────────────

function isBanned(user: User): boolean {
  if (!user.banned_until) return false;
  return new Date(user.banned_until) > new Date();
}

function isPermanentBan(user: User): boolean {
  if (!user.banned_until) return false;
  return new Date(user.banned_until).getFullYear() >= 9999;
}

function banLabel(user: User): string {
  if (!isBanned(user)) return '';
  if (isPermanentBan(user)) return 'Permanent';
  const until = new Date(user.banned_until!);
  return `Until ${until.toLocaleDateString()}`;
}

// ─── Toast Component ─────────────────────────────────────────────────────────

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium pointer-events-auto
            animate-[slideInRight_0.3s_ease] transition-all
            ${t.type === 'success'
              ? 'bg-[#0A2E1A] border-[#10B981]/40 text-[#10B981]'
              : 'bg-[#2E0A0A] border-[#EF4444]/40 text-[#EF4444]'
            }`}
        >
          {t.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Ban Modal ────────────────────────────────────────────────────────────────

interface BanModalProps {
  state: BanModalState;
  token: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

function BanModal({ state, token, onClose, onSuccess, onError, onRefresh }: BanModalProps) {
  const [mode, setMode] = useState<'24h' | '72h' | '7d' | 'permanent'>('24h');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.open) {
      setMode('24h');
      setReason('');
    }
  }, [state.open]);

  if (!state.open || !state.user) return null;

  const durationMap: Record<typeof mode, { label: string; hours?: number; permanent?: boolean }> = {
    '24h': { label: '24 Hours', hours: 24 },
    '72h': { label: '72 Hours', hours: 72 },
    '7d': { label: '7 Days', hours: 168 },
    permanent: { label: 'Permanent Ban', permanent: true },
  };

  const handleBan = async () => {
    if (!reason.trim()) {
      onError('Please provide a reason for the ban.');
      return;
    }
    setLoading(true);
    try {
      const selected = durationMap[mode];
      const body: Record<string, unknown> = { reason: reason.trim() };
      if (selected.permanent) {
        body.permanent = true;
      } else {
        body.duration_hours = selected.hours;
      }

      const res = await fetch(
        `http://localhost:8000/api/v1/admin/users/${state.user!.id}/ban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        onSuccess(
          `${state.user!.username} has been banned (${durationMap[mode].label}).`
        );
        onRefresh();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        onError(err.detail || 'Failed to ban user.');
      }
    } catch {
      onError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ban-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 bg-[#12121A] border border-[#2A2A38] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2A2A38]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EF4444]/15 flex items-center justify-center">
              <Ban className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <h2 id="ban-modal-title" className="text-base font-semibold text-[#E8E8F0]">
                Ban User
              </h2>
              <p className="text-xs text-[#8B8B9E]">{state.user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1A1A24] rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-[#8B8B9E]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Duration Options */}
          <div>
            <label className="block text-xs font-medium text-[#8B8B9E] uppercase tracking-wider mb-3">
              Ban Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(durationMap) as [typeof mode, { label: string }][]).map(
                ([key, { label }]) => (
                  <button
                    key={key}
                    id={`ban-duration-${key}`}
                    onClick={() => setMode(key)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      mode === key
                        ? key === 'permanent'
                          ? 'bg-[#EF4444]/20 border-[#EF4444]/60 text-[#EF4444]'
                          : 'bg-[#7C3AED]/20 border-[#7C3AED]/60 text-[#D946EF]'
                        : 'bg-[#0A0A0F] border-[#2A2A38] text-[#8B8B9E] hover:border-[#3A3A48] hover:text-[#E8E8F0]'
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="ban-reason"
              className="block text-xs font-medium text-[#8B8B9E] uppercase tracking-wider mb-2"
            >
              Reason <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for this ban…"
              rows={3}
              className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#2A2A38] rounded-lg text-sm text-[#E8E8F0] placeholder-[#8B8B9E] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all resize-none"
            />
          </div>

          {/* Warning note for permanent */}
          {mode === 'permanent' && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#EF4444]">
                This will permanently ban the account. The user will be deactivated immediately.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#1A1A24] hover:bg-[#2A2A38] border border-[#2A2A38] rounded-lg text-sm text-[#8B8B9E] hover:text-[#E8E8F0] transition-all font-medium"
            >
              Cancel
            </button>
            <button
              id="confirm-ban-btn"
              onClick={handleBan}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'permanent'
                  ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                  : 'bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Banning…' : `Ban — ${durationMap[mode].label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersTab() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [banModal, setBanModal] = useState<BanModalState>({ open: false, user: null });
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const itemsPerPage = 20;

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Fetch users ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Warn action ────────────────────────────────────────────────────────────
  const handleWarn = async (user: User) => {
    setActionLoading((prev) => ({ ...prev, [`warn-${user.id}`]: true }));
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/admin/users/${user.id}/warn`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: 'Warning issued from admin panel.' }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        addToast('success', `Warning #${data.warnings_count} issued to ${user.username}.`);
        fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast('error', err.detail || 'Failed to warn user.');
      }
    } catch {
      addToast('error', 'Network error. Please try again.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`warn-${user.id}`]: false }));
    }
  };

  // ── Filtering & pagination ─────────────────────────────────────────────────
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? user.is_active : !user.is_active) ||
      (statusFilter === 'banned' ? isBanned(user) : false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#D946EF] flex items-center justify-center text-white font-semibold flex-shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-[#E8E8F0] truncate">{user.username}</div>
            <div className="text-xs text-[#8B8B9E] truncate">{user.email}</div>
          </div>
        </div>
      ),
      width: '22%',
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            user.role === 'super_admin'
              ? 'bg-[#7C3AED]/20 text-[#D946EF]'
              : user.role === 'admin'
              ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
              : 'bg-[#8B8B9E]/20 text-[#8B8B9E]'
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (user: User) => (
        <span className="capitalize text-[#E8E8F0]">{user.plan_code || 'free'}</span>
      ),
    },
    {
      key: 'warnings',
      header: 'Warnings',
      render: (user: User) => (
        <div className="flex items-center gap-1.5">
          {user.warnings_count > 0 && (
            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
          )}
          <span
            className={`font-semibold ${
              user.warnings_count >= 3
                ? 'text-[#EF4444]'
                : user.warnings_count > 0
                ? 'text-[#F59E0B]'
                : 'text-[#8B8B9E]'
            }`}
          >
            {user.warnings_count}
          </span>
          {user.total_violations > 0 && (
            <span className="text-xs text-[#8B8B9E]">/ {user.total_violations} viol.</span>
          )}
        </div>
      ),
    },
    {
      key: 'ban_status',
      header: 'Ban Status',
      render: (user: User) => {
        if (isBanned(user)) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#EF4444]/20 text-[#EF4444] w-fit">
                {isPermanentBan(user) ? '🔴 Permanent' : '🔴 Banned'}
              </span>
              {!isPermanentBan(user) && (
                <span className="text-[10px] text-[#8B8B9E]">{banLabel(user)}</span>
              )}
            </div>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#10B981]/10 text-[#10B981]">
            ✓ Clear
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Account',
      render: (user: User) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            user.is_active
              ? 'bg-[#10B981]/20 text-[#10B981]'
              : 'bg-[#EF4444]/20 text-[#EF4444]'
          }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex items-center gap-1.5">
          {/* View Details */}
          <button
            onClick={() => setSelectedUser(user)}
            className="p-2 hover:bg-[#1A1A24] rounded-lg transition-colors"
            aria-label={`View details for ${user.username}`}
            title="View Details"
          >
            <Eye className="w-4 h-4 text-[#8B8B9E] hover:text-[#E8E8F0]" />
          </button>

          {/* Warn */}
          <button
            id={`warn-btn-${user.id}`}
            onClick={() => handleWarn(user)}
            disabled={actionLoading[`warn-${user.id}`]}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
              bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#F59E0B]
              border border-[#F59E0B]/30 hover:border-[#F59E0B]/50
              transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Warn ${user.username}`}
            title="Issue Warning"
          >
            <AlertTriangle className="w-3 h-3" />
            {actionLoading[`warn-${user.id}`] ? '…' : 'Warn'}
          </button>

          {/* Ban */}
          <button
            id={`ban-btn-${user.id}`}
            onClick={() => setBanModal({ open: true, user })}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
              bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444]
              border border-[#EF4444]/30 hover:border-[#EF4444]/50
              transition-all"
            aria-label={`Ban ${user.username}`}
            title="Ban User"
          >
            <Ban className="w-3 h-3" />
            Ban
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Toast Notifications */}
      <ToastList toasts={toasts} onDismiss={dismissToast} />

      {/* Ban Modal */}
      <BanModal
        state={banModal}
        token={token || ''}
        onClose={() => setBanModal({ open: false, user: null })}
        onSuccess={(msg) => addToast('success', msg)}
        onError={(msg) => addToast('error', msg)}
        onRefresh={fetchUsers}
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#E8E8F0] mb-2">Users</h1>
          <p className="text-[#8B8B9E]">
            Manage user accounts, issue warnings, and enforce bans.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B9E]" />
            <input
              id="users-search"
              type="text"
              placeholder="Search by email or username…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#12121A] border border-[#2A2A38] rounded-lg text-sm text-[#E8E8F0] placeholder-[#8B8B9E] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
            />
          </div>

          {/* Role Filter */}
          <select
            id="users-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#12121A] border border-[#2A2A38] rounded-lg text-sm text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          {/* Status Filter */}
          <select
            id="users-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#12121A] border border-[#2A2A38] rounded-lg text-sm text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl px-4 py-3">
            <div className="text-xs text-[#8B8B9E] mb-1">Total Users</div>
            <div className="text-xl font-bold text-[#E8E8F0]">{users.length}</div>
          </div>
          <div className="bg-[#12121A] border border-[#F59E0B]/20 rounded-xl px-4 py-3">
            <div className="text-xs text-[#8B8B9E] mb-1">Warned</div>
            <div className="text-xl font-bold text-[#F59E0B]">
              {users.filter((u) => u.warnings_count > 0).length}
            </div>
          </div>
          <div className="bg-[#12121A] border border-[#EF4444]/20 rounded-xl px-4 py-3">
            <div className="text-xs text-[#8B8B9E] mb-1">Banned</div>
            <div className="text-xl font-bold text-[#EF4444]">
              {users.filter(isBanned).length}
            </div>
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={paginatedUsers}
          columns={columns}
          loading={loading}
          emptyMessage="No users found"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#8B8B9E]">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
              {filteredUsers.length} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#12121A] border border-[#2A2A38] rounded-lg text-sm text-[#E8E8F0] hover:bg-[#1A1A24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#12121A] border border-[#2A2A38] rounded-lg text-sm text-[#E8E8F0] hover:bg-[#1A1A24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        <UserDetailModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      </div>
    </>
  );
}
