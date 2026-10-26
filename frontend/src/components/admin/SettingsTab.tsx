import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsTab() {
  const { token, user } = useAuth();
  const [settings, setSettings] = useState<any>({});
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSettings(data.settings || {});
      setEditable(data.editable || false);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await fetch('http://localhost:8000/api/v1/admin/settings', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  if (!editable) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-yellow-500" />
            Settings (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-gray-800 border-gray-700 mb-6">
            <AlertDescription>
              Only super admins can edit global settings. You can view current configuration
              below.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-800 rounded">
                <span className="font-medium">{key}</span>
                <span className="text-gray-400">{JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {saved && (
          <Alert className="bg-green-900/20 border-green-500/50">
            <AlertDescription className="text-green-400">
              Settings saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="free_uses">Free Uses Limit</Label>
            <Input
              id="free_uses"
              type="number"
              value={settings.free_uses_limit || 5}
              onChange={(e) => updateSetting('free_uses_limit', parseInt(e.target.value))}
              className="bg-gray-800 border-gray-700"
            />
            <p className="text-sm text-gray-500">
              Number of free uses per user (lifetime)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto_block">Auto-Block Threshold</Label>
            <Input
              id="auto_block"
              type="number"
              step="0.01"
              value={settings.auto_block_threshold || 0.9}
              onChange={(e) => updateSetting('auto_block_threshold', parseFloat(e.target.value))}
              className="bg-gray-800 border-gray-700"
            />
            <p className="text-sm text-gray-500">
              Risk score threshold for automatic blocking (0.0 - 1.0)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debate_threshold">Debate Threshold</Label>
            <Input
              id="debate_threshold"
              type="number"
              step="0.01"
              value={settings.debate_threshold || 0.7}
              onChange={(e) => updateSetting('debate_threshold', parseFloat(e.target.value))}
              className="bg-gray-800 border-gray-700"
            />
            <p className="text-sm text-gray-500">
              Risk score threshold to trigger full agent debate (0.0 - 1.0)
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
            <div className="space-y-0.5">
              <Label htmlFor="ml_classifier">ML Classifier</Label>
              <p className="text-sm text-gray-500">Enable machine learning classifier</p>
            </div>
            <Switch
              id="ml_classifier"
              checked={settings.enable_ml_classifier === true || settings.enable_ml_classifier === 'true'}
              onCheckedChange={(checked) => updateSetting('enable_ml_classifier', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
            <div className="space-y-0.5">
              <Label htmlFor="rag_memory">RAG Memory</Label>
              <p className="text-sm text-gray-500">Enable RAG attack memory retrieval</p>
            </div>
            <Switch
              id="rag_memory"
              checked={settings.enable_rag_memory === true || settings.enable_rag_memory === 'true'}
              onCheckedChange={(checked) => updateSetting('enable_rag_memory', checked)}
            />
          </div>
        </div>

        <Button onClick={saveSettings} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
