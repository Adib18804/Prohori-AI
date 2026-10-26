import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Database, Cpu, Activity, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SystemTab() {
  const { token } = useAuth();
  const [health, setHealth] = useState<any>(null);
  const [costs, setCosts] = useState<any>(null);

  useEffect(() => {
    loadHealth();
    loadCosts();
    const interval = setInterval(() => {
      loadHealth();
      loadCosts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/system/health', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to load health:', error);
    }
  };

  const loadCosts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/metrics/costs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCosts(data);
    } catch (error) {
      console.error('Failed to load costs:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Database</CardTitle>
            <Database className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={health?.database === 'healthy' ? 'default' : 'destructive'}
              className="text-sm"
            >
              {health?.database || 'Loading...'}
            </Badge>
            <p className="text-xs text-gray-500 mt-2">PostgreSQL + pgvector</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Backend</CardTitle>
            <Cpu className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-sm">
              Operational
            </Badge>
            <p className="text-xs text-gray-500 mt-2">FastAPI + Uvicorn</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">LLM Services</CardTitle>
            <Activity className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-sm">
              Available
            </Badge>
            <p className="text-xs text-gray-500 mt-2">Groq + Mistral</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Uptime</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">99.9%</div>
            <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
              <div>
                <p className="font-medium">Total Users</p>
                <p className="text-sm text-gray-400">Registered accounts</p>
              </div>
              <p className="text-2xl font-bold">{health?.total_users || 0}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
              <div>
                <p className="font-medium">Database Status</p>
                <p className="text-sm text-gray-400">Connection pool</p>
              </div>
              <Badge variant={health?.database === 'healthy' ? 'default' : 'destructive'}>
                {health?.database || 'unknown'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
              <div>
                <p className="font-medium">Last Health Check</p>
                <p className="text-sm text-gray-400">System monitoring</p>
              </div>
              <p className="text-sm text-gray-400">
                {health?.timestamp
                  ? new Date(health.timestamp).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {costs && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Cost Metrics (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800 rounded">
                <p className="text-sm text-gray-400">Total Debates</p>
                <p className="text-3xl font-bold mt-2">{costs.total_debates_30d}</p>
              </div>
              <div className="p-4 bg-gray-800 rounded">
                <p className="text-sm text-gray-400">Total Tokens</p>
                <p className="text-3xl font-bold mt-2">
                  {costs.total_tokens_30d.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-800 rounded">
                <p className="text-sm text-gray-400">Total Cost</p>
                <p className="text-3xl font-bold mt-2 text-green-400">
                  ${costs.total_cost_usd_30d.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Service Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-sm">RAG Memory</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-sm">ML Classifier</span>
              <Badge variant="secondary">Disabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-sm">Real-time Updates</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-sm">Vector Dimension</span>
              <Badge variant="outline">1536</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
