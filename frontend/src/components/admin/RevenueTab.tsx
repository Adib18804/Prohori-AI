import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DollarSign, TrendingUp, Users, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

interface RevenueData {
  mrr_cents: number;
  arr_cents: number;
  revenue_by_plan: Array<{
    plan_code: string;
    plan_name: string;
    price_usd_cents: number;
    user_count: number;
    monthly_revenue_cents: number;
  }>;
  new_signups_30d: number;
  total_active_users: number;
  paying_users: number;
  conversion_rate: number;
}

export default function RevenueTab() {
  const { token } = useAuth();
  const [data, setData] = useState<RevenueData | null>(null);

  useEffect(() => {
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/revenue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load revenue:', error);
    }
  };

  if (!data) return <div className="text-gray-400">Loading...</div>;

  const formatUSD = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">MRR</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatUSD(data.mrr_cents)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Monthly Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">ARR</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {formatUSD(data.arr_cents)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Annual Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Paying Users</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{data.paying_users}</div>
            <p className="text-xs text-gray-500 mt-1">
              of {data.total_active_users} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Conversion</CardTitle>
            <Percent className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {data.conversion_rate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Free to Paid</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Revenue by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenue_by_plan}>
              <XAxis dataKey="plan_name" stroke="#6b7280" />
              <YAxis
                stroke="#6b7280"
                tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.375rem',
                }}
                formatter={(value: any) => [formatUSD(value), 'Revenue']}
              />
              <Bar dataKey="monthly_revenue_cents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Plan Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.revenue_by_plan.map((plan) => (
              <div
                key={plan.plan_code}
                className="flex items-center justify-between p-3 bg-gray-800 rounded"
              >
                <div>
                  <p className="font-medium">{plan.plan_name}</p>
                  <p className="text-sm text-gray-400">
                    {plan.user_count} users × {formatUSD(plan.price_usd_cents)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">
                    {formatUSD(plan.monthly_revenue_cents)}
                  </p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Growth Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800 rounded">
              <p className="text-sm text-gray-400">New Signups (30d)</p>
              <p className="text-3xl font-bold mt-2">{data.new_signups_30d}</p>
            </div>
            <div className="p-4 bg-gray-800 rounded">
              <p className="text-sm text-gray-400">Total Active Users</p>
              <p className="text-3xl font-bold mt-2">{data.total_active_users}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
