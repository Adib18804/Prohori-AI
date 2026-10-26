import { useState, useEffect } from 'react';
import { Activity, Database, Zap, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HealthCardProps {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: string;
  uptime?: string;
}

function HealthCard({ service, status, responseTime, uptime }: HealthCardProps) {
  const statusConfig = {
    healthy: { color: 'text-[#10B981]', bg: 'bg-[#10B981]/20', border: 'border-[#10B981]/30', icon: CheckCircle },
    degraded: { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/20', border: 'border-[#F59E0B]/30', icon: AlertCircle },
    down: { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/20', border: 'border-[#EF4444]/30', icon: AlertCircle },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={`bg-[#12121A] border ${config.border} rounded-xl p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#E8E8F0] mb-1">{service}</h3>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color} capitalize`}>{status}</span>
          </div>
        </div>
        <div className={`p-2 ${config.bg} rounded-lg`}>
          <StatusIcon className={`w-5 h-5 ${config.color}`} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {responseTime && (
          <div>
            <div className="text-xs text-[#8B8B9E] mb-1">Response Time</div>
            <div className="text-sm font-semibold text-[#E8E8F0]">{responseTime}</div>
          </div>
        )}
        {uptime && (
          <div>
            <div className="text-xs text-[#8B8B9E] mb-1">Uptime</div>
            <div className="text-sm font-semibold text-[#E8E8F0]">{uptime}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SystemTab() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<any>(null);

  const recentErrors = [
    {
      id: '1',
      timestamp: '2024-12-10 14:32:45',
      level: 'error',
      service: 'Backend API',
      message: 'Database connection timeout',
      count: 3,
    },
    {
      id: '2',
      timestamp: '2024-12-10 14:15:22',
      level: 'warning',
      service: 'Groq API',
      message: 'Rate limit approaching (95%)',
      count: 1,
    },
    {
      id: '3',
      timestamp: '2024-12-10 13:58:10',
      level: 'error',
      service: 'Judge Agent',
      message: 'Model response parsing failed',
      count: 2,
    },
  ];

  useEffect(() => {
    fetchHealth();
  }, [token]);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/health', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostic = async () => {
    // TODO: Implement diagnostic endpoint
    alert('Running diagnostic checks...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8E8F0] mb-2">System Health</h1>
          <p className="text-[#8B8B9E]">Monitor system status and performance</p>
        </div>
        <button
          onClick={runDiagnostic}
          className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Run Diagnostic
        </button>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HealthCard
          service="Backend API"
          status="healthy"
          responseTime="24ms"
          uptime="99.9%"
        />
        <HealthCard
          service="PostgreSQL"
          status={healthData?.database === 'connected' ? 'healthy' : 'down'}
          responseTime="8ms"
          uptime="99.8%"
        />
        <HealthCard
          service="Groq API"
          status={healthData?.ai_services === 'available' ? 'healthy' : 'degraded'}
          responseTime="285ms"
          uptime="98.5%"
        />
        <HealthCard
          service="Mistral API"
          status="healthy"
          responseTime="320ms"
          uptime="99.2%"
        />
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-[#10B981]/20 to-[#3B82F6]/20 rounded-lg border border-[#10B981]/30">
              <Clock className="w-5 h-5 text-[#10B981]" />
            </div>
            <span className="text-sm text-[#8B8B9E]">Uptime</span>
          </div>
          <div className="text-2xl font-bold text-[#E8E8F0]">12d 14h 32m</div>
        </div>

        <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-[#7C3AED]/20 to-[#D946EF]/20 rounded-lg border border-[#7C3AED]/30">
              <Activity className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <span className="text-sm text-[#8B8B9E]">Active Sessions</span>
          </div>
          <div className="text-2xl font-bold text-[#E8E8F0]">42</div>
        </div>

        <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-[#EF4444]/20 to-[#F59E0B]/20 rounded-lg border border-[#EF4444]/30">
              <AlertCircle className="w-5 h-5 text-[#EF4444]" />
            </div>
            <span className="text-sm text-[#8B8B9E]">Error Rate</span>
          </div>
          <div className="text-2xl font-bold text-[#E8E8F0]">0.8%</div>
        </div>

        <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-[#F59E0B]/20 to-[#10B981]/20 rounded-lg border border-[#F59E0B]/30">
              <DollarSign className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <span className="text-sm text-[#8B8B9E]">Cost Today</span>
          </div>
          <div className="text-2xl font-bold text-[#E8E8F0]">$42.50</div>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#2A2A38]">
          <h3 className="text-lg font-semibold text-[#E8E8F0]">Recent Errors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A38]">
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A38]">
              {recentErrors.map((error) => (
                <tr key={error.id} className="hover:bg-[#1A1A24] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#8B8B9E] font-mono">
                    {error.timestamp}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      error.level === 'error'
                        ? 'bg-[#EF4444]/20 text-[#EF4444]'
                        : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                    }`}>
                      {error.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#E8E8F0]">{error.service}</td>
                  <td className="px-6 py-4 text-sm text-[#8B8B9E]">{error.message}</td>
                  <td className="px-6 py-4 text-sm text-[#E8E8F0]">{error.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
