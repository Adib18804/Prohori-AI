import { Dialog } from '@/components/ui/Dialog';
import { X, Mail, User, Shield, Calendar, Activity } from 'lucide-react';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/70" onClick={onClose} />
        
        <div className="relative bg-[#12121A] border border-[#2A2A38] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#2A2A38] bg-[#12121A]">
            <h2 className="text-xl font-semibold text-[#E8E8F0]">User Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1A1A24] rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-[#8B8B9E]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Profile Section */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#D946EF] flex items-center justify-center text-white text-2xl font-semibold">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#E8E8F0] mb-1">{user.username}</h3>
                <p className="text-sm text-[#8B8B9E] mb-2">{user.email}</p>
                <div className="flex gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'super_admin' ? 'bg-[#7C3AED]/20 text-[#D946EF]' :
                    user.role === 'admin' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' :
                    'bg-[#8B8B9E]/20 text-[#8B8B9E]'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    user.is_active ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1A1A24] rounded-lg border border-[#2A2A38]">
                <div className="flex items-center gap-2 text-[#8B8B9E] mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-medium">User ID</span>
                </div>
                <p className="text-sm text-[#E8E8F0] font-mono break-all">{user.id}</p>
              </div>

              <div className="p-4 bg-[#1A1A24] rounded-lg border border-[#2A2A38]">
                <div className="flex items-center gap-2 text-[#8B8B9E] mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Member Since</span>
                </div>
                <p className="text-sm text-[#E8E8F0]">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="p-4 bg-[#1A1A24] rounded-lg border border-[#2A2A38]">
                <div className="flex items-center gap-2 text-[#8B8B9E] mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium">Last Login</span>
                </div>
                <p className="text-sm text-[#E8E8F0]">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </p>
              </div>

              <div className="p-4 bg-[#1A1A24] rounded-lg border border-[#2A2A38]">
                <div className="flex items-center gap-2 text-[#8B8B9E] mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-medium">Plan</span>
                </div>
                <p className="text-sm text-[#E8E8F0] capitalize">{user.plan_code || 'free'}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 bg-[#1A1A24] rounded-lg border border-[#2A2A38]">
              <h4 className="text-sm font-medium text-[#E8E8F0] mb-3">Usage Statistics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-semibold text-[#E8E8F0]">{user.monthly_debate_count || 0}</div>
                  <div className="text-xs text-[#8B8B9E]">Debates</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-[#E8E8F0]">{user.free_uses_used || 0}</div>
                  <div className="text-xs text-[#8B8B9E]">Free Uses</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-[#E8E8F0]">0</div>
                  <div className="text-xs text-[#8B8B9E]">Violations</div>
                </div>
              </div>
            </div>

            {/* Violation History */}
            <div>
              <h4 className="text-sm font-medium text-[#E8E8F0] mb-3">Violation History</h4>
              <div className="p-4 bg-[#1A1A24] rounded-lg border border-[#2A2A38] text-center">
                <p className="text-sm text-[#8B8B9E]">No violations recorded</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 flex gap-3 p-6 border-t border-[#2A2A38] bg-[#12121A]">
            <button className="flex-1 px-4 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border border-[#2A2A38] text-[#E8E8F0] rounded-lg transition-colors text-sm font-medium">
              Change Plan
            </button>
            <button className="flex-1 px-4 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border border-[#2A2A38] text-[#E8E8F0] rounded-lg transition-colors text-sm font-medium">
              Change Role
            </button>
            <button className="flex-1 px-4 py-2 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] rounded-lg transition-colors text-sm font-medium">
              Suspend
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
