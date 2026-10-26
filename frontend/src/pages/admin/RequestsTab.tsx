import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Zap, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  return (
    <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-gradient-to-br from-[#7C3AED]/20 to-[#D946EF]/20 rounded-lg border border-[#7C3AED]/30">
          {icon}
        </div>
        <span className={`flex items-center gap-1 text-sm font-medium ${
          trend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'
        }`}>
          {change}
        </span>
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold text-[#E8E8F0]">{value}</div>
        <div className="text-sm text-[#8B8B9E]">{title}</div>
      </div>
    </div>
  );
}

export default function RequestsTab() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7');

  // Mock data
  const dailyRequests = [
    { date: 'Dec 1', requests: 1250 },
    { date: 'Dec 2', requests: 1420 },
    { date: 'Dec 3', requests: 1180 },
    { date: 'Dec 4', requests: 1650 },
    { date: 'Dec 5', requests: 1890 },
    { date: 'Dec 6', requests: 1720 },
    { date: 'Dec 7', requests: 2100 },
  ];

  const verdictDistribution = [
    { name: 'ALLOW', value: 8520, color: '#10B981' },
    { name: 'BLOCK', value: 450, color: '#EF4444' },
    { name: 'REDACT', value: 230, color: '#F59E0B' },
  ];

  const agentLatency = [
    { agent: 'Triage', latency: 85 },
    { agent: 'Prosecutor', latency: 320 },
    { agent: 'Defender', latency: 305 },
    { agent: 'Judge', latency: 280 },
  ];

  useEffect(() => {
    fetchMetrics();
  }, [token, timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // Mock - replace with API call
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setLoading(false);
    }
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
          <h1 className="text-2xl font-semibold text-[#E8E8F0] mb-2">Requests</h1>
          <p className="text-[#8B8B9E]">Monitor API request metrics and performance</p>
        </div>

        {/* Time Range Toggle */}
        <div className="flex gap-2 bg-[#12121A] border border-[#2A2A38] rounded-lg p-1">
          {(['7', '30', '90'] as const).map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === days
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white'
                  : 'text-[#8B8B9E] hover:text-[#E8E8F0]'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Requests"
          value="9,200"
          change="+18.2%"
          trend="up"
          icon={<Activity className="w-5 h-5 text-[#7C3AED]" />}
        />
        <MetricCard
          title="Requests Today"
          value="2,100"
          change="+22.4%"
          trend="up"
          icon={<Zap className="w-5 h-5 text-[#7C3AED]" />}
        />
        <MetricCard
          title="Avg Latency"
          value="287ms"
          change="-12.5%"
          trend="up"
          icon={<Clock className="w-5 h-5 text-[#7C3AED]" />}
        />
        <MetricCard
          title="Error Rate"
          value="0.8%"
          change="-0.3%"
          trend="up"
          icon={<AlertCircle className="w-5 h-5 text-[#7C3AED]" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Requests */}
        <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#E8E8F0] mb-4">Requests Per Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRequests}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
              <XAxis dataKey="date" stroke="#8B8B9E" style={{ fontSize: '12px' }} />
              <YAxis stroke="#8B8B9E" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12121A',
                  border: '1px solid #2A2A38',
                  borderRadius: '8px',
                  color: '#E8E8F0',
                }}
              />
              <Line type="monotone" dataKey="requests" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Verdict Distribution */}
        <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#E8E8F0] mb-4">Verdict Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={verdictDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {verdictDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12121A',
                  border: '1px solid #2A2A38',
                  borderRadius: '8px',
                  color: '#E8E8F0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Latency */}
      <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#E8E8F0] mb-4">Average Latency Per Agent</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agentLatency}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
            <XAxis dataKey="agent" stroke="#8B8B9E" style={{ fontSize: '12px' }} />
            <YAxis stroke="#8B8B9E" style={{ fontSize: '12px' }} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12121A',
                border: '1px solid #2A2A38',
                borderRadius: '8px',
                color: '#E8E8F0',
              }}
            />
            <Bar dataKey="latency" fill="#7C3AED" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
