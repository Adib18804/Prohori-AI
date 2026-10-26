import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AttacksTab() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadAttacks();
  }, []);

  const loadAttacks = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/metrics/attacks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load attacks:', error);
    }
  };

  if (!data) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Classifications
            </CardTitle>
            <Shield className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.attack_breakdown.reduce((sum: number, a: any) => sum + a.count, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              High Risk Detected
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {
                data.attack_breakdown.find((a: any) => a.classification === 'HIGH_RISK')
                  ?.count || 0
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">Immediate blocks</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Risk Score</CardTitle>
            <Shield className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {(
                data.attack_breakdown.reduce(
                  (sum: number, a: any) => sum + a.avg_risk_score * a.count,
                  0
                ) /
                data.attack_breakdown.reduce((sum: number, a: any) => sum + a.count, 0)
              ).toFixed(3)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all requests</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Attack Classifications</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.attack_breakdown}>
              <XAxis dataKey="classification" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.375rem',
                }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Classification Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.attack_breakdown.map((item: any) => (
              <div
                key={item.classification}
                className="flex items-center justify-between p-4 bg-gray-800 rounded"
              >
                <div>
                  <p className="font-medium">{item.classification}</p>
                  <p className="text-sm text-gray-400">
                    Avg Risk: {item.avg_risk_score.toFixed(3)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-gray-500">requests</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
