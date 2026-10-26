import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

export default function RequestsTab() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/metrics/requests?days=30', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  if (!data) return <div className="text-gray-400">Loading...</div>;

  const verdictData = Object.entries(data.verdict_breakdown || {}).map(([key, value]) => ({
    name: key,
    value: value as number,
  }));

  const COLORS = {
    ALLOW: '#10b981',
    BLOCK: '#ef4444',
    REDACT: '#f59e0b',
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Daily Requests (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.daily_requests}>
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.375rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Verdict Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={verdictData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {verdictData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.375rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Summary Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded">
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-3xl font-bold mt-1">
                  {data.daily_requests.reduce(
                    (sum: number, day: any) => sum + day.count,
                    0
                  )}
                </p>
              </div>
              {verdictData.map((verdict) => (
                <div key={verdict.name} className="p-4 bg-gray-800 rounded">
                  <p className="text-sm text-gray-400">{verdict.name}</p>
                  <div className="flex items-end gap-2 mt-1">
                    <p className="text-2xl font-bold">{verdict.value}</p>
                    <p className="text-sm text-gray-500 pb-0.5">
                      (
                      {(
                        (verdict.value /
                          verdictData.reduce((sum, v) => sum + v.value, 0)) *
                        100
                      ).toFixed(1)}
                      %)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
