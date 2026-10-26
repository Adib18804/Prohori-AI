import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, Users, TrendingDown } from 'lucide-react';
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
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
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

export default function RevenueTab() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    mrr: 0,
    arr: 0,
    active_subs: 0,
    churn: 0,
  });

  // Mock data - replace with API call
  const monthlyRevenue = [
    { month: 'Jan', revenue: 4200 },
    { month: 'Feb', revenue: 5800 },
    { month: 'Mar', revenue: 7100 },
    { month: 'Apr', revenue: 8500 },
    { month: 'May', revenue: 9200 },
    { month: 'Jun', revenue: 11000 },
    { month: 'Jul', revenue: 12500 },
    { month: 'Aug', revenue: 14200 },
    { month: 'Sep', revenue: 15800 },
    { month: 'Oct', revenue: 17500 },
    { month: 'Nov', revenue: 19200 },
    { month: 'Dec', revenue: 21000 },
  ];

  const revenueByPlan = [
    { name: 'Free', value: 0, color: '#8B8B9E' },
    { name: 'Student', value: 3500, color: '#3B82F6' },
    { name: 'Professional', value: 12000, color: '#7C3AED' },
    { name: 'Business', value: 5500, color: '#D946EF' },
  ];

  const topCustomers = [
    { name: 'TechCorp Inc', email: 'admin@techcorp.com', plan: 'Business', mrr: 1490 },
    { name: 'StartupXYZ', email: 'ceo@startupxyz.com', plan: 'Professional', mrr: 290 },
    { name: 'DataLabs', email: 'info@datalabs.io', plan: 'Business', mrr: 1490 },
    { name: 'AI Research Co', email: 'research@ai-co.com', plan: 'Professional', mrr: 290 },
    { name: 'SecureApp Ltd', email: 'admin@secureapp.com', plan: 'Professional', mrr: 290 },
  ];

  useEffect(() => {
    fetchRevenue();
  }, [token]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setMetrics({
        mrr: 21000,
        arr: 252000,
        active_subs: 87,
        churn: 2.4,
      });
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
    } finally {
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
      <div>
        <h1 className="text-2xl font-semibold text-[#E8E8F0] mb-2">Revenue</h1>
        <p className="text-[#8B8B9E]">Monitor revenue metrics and subscription performance</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={`$${metrics.mrr.toLocaleString()}`}
          change="+12.5%"
          trend="up"
          icon={<DollarSign className="w-5 h-5 text-[#7C3AED]" />}
        />
        <MetricCard
          title="Annual Recurring Revenue"
          value={`$${metrics.arr.toLocaleString()}`}
          change="+15.8%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5 text-[#7C3AED]" />}
        />
        <MetricCard
          title="Active Subscriptions"
          value={metrics.active_subs.toString()}
          change="+8"
          trend="up"
          icon={<Users className="w-5 h-5 text-[#7C3AED]" />}
        />
        <MetricCard
          title="Churn Rate"
          value={`${metrics.churn}%`}
          change="-0.3%"
          trend="up"
          icon={<TrendingDown className="w-5 h-5 text-[#7C3AED]" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#E8E8F0] mb-4">Revenue Trend (12 months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
              <XAxis dataKey="month" stroke="#8B8B9E" style={{ fontSize: '12px' }} />
              <YAxis stroke="#8B8B9E" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12121A',
                  border: '1px solid #2A2A38',
                  borderRadius: '8px',
                  color: '#E8E8F0',
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Plan */}
        <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#E8E8F0] mb-4">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueByPlan}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {revenueByPlan.map((entry, index) => (
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

      {/* Top Customers */}
      <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#2A2A38]">
          <h3 className="text-lg font-semibold text-[#E8E8F0]">Top 10 Customers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A38]">
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">
                  MRR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A38]">
              {topCustomers.map((customer, index) => (
                <tr key={index} className="hover:bg-[#1A1A24] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-[#E8E8F0]">{customer.name}</div>
                      <div className="text-xs text-[#8B8B9E]">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#7C3AED]/20 text-[#D946EF]">
                      {customer.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#E8E8F0] font-semibold">
                    ${customer.mrr.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
