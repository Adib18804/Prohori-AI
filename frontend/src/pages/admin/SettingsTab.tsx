import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsTab() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Security Thresholds
    triage_threshold: 0.7,
    debate_threshold: 0.8,
    block_threshold: 0.9,
    
    // Feature Flags
    enable_rag: true,
    enable_ml_classifier: false,
    enable_parallel_agents: true,
    enable_debug_mode: false,
    
    // Warnings & Bans
    warning_limit: 3,
    warning_window_hours: 24,
    ban_duration_hours: 24,
    
    // Default Models
    default_groq_model: 'mixtral-8x7b-32768',
    default_mistral_model: 'mistral-large-latest',
    embedding_model: 'text-embedding-3-small',
    fallback_model: 'mistral-large-latest',
  });

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Mock - replace with API call
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-semibold text-[#E8E8F0] mb-2">Settings</h1>
          <p className="text-[#8B8B9E]">Configure system behavior and security parameters</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-medium text-[#F59E0B] mb-1">Super Admin Only</div>
          <div className="text-sm text-[#8B8B9E]">
            Changing these settings affects all users system-wide. Proceed with caution.
          </div>
        </div>
      </div>

      {/* Security Thresholds */}
      <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#E8E8F0] mb-1">Security Thresholds</h3>
          <p className="text-sm text-[#8B8B9E]">Control sensitivity of threat detection</p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#E8E8F0]">Triage Threshold</label>
              <span className="text-sm text-[#7C3AED] font-mono">{settings.triage_threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.triage_threshold}
              onChange={(e) => setSettings({ ...settings, triage_threshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#1A1A24] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
            />
            <p className="text-xs text-[#8B8B9E] mt-1">Minimum risk score to flag for initial review</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#E8E8F0]">Debate Threshold</label>
              <span className="text-sm text-[#7C3AED] font-mono">{settings.debate_threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.debate_threshold}
              onChange={(e) => setSettings({ ...settings, debate_threshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#1A1A24] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
            />
            <p className="text-xs text-[#8B8B9E] mt-1">Minimum risk score to trigger agent debate</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#E8E8F0]">Block Threshold</label>
              <span className="text-sm text-[#7C3AED] font-mono">{settings.block_threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.block_threshold}
              onChange={(e) => setSettings({ ...settings, block_threshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#1A1A24] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
            />
            <p className="text-xs text-[#8B8B9E] mt-1">Confidence threshold for automatic block verdict</p>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#E8E8F0] mb-1">Feature Flags</h3>
          <p className="text-sm text-[#8B8B9E]">Enable or disable system features</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'enable_rag', label: 'RAG Attack Memory', desc: 'Use vector database for pattern matching' },
            { key: 'enable_ml_classifier', label: 'ML Classifier', desc: 'Pre-filter with machine learning model' },
            { key: 'enable_parallel_agents', label: 'Parallel Agent Execution', desc: 'Run prosecutor and defender simultaneously' },
            { key: 'enable_debug_mode', label: 'Debug Mode', desc: 'Log detailed execution traces' },
          ].map((feature) => (
            <div key={feature.key} className="flex items-start gap-3 p-4 bg-[#1A1A24] rounded-lg border border-[#2A2A38]">
              <input
                type="checkbox"
                id={feature.key}
                checked={settings[feature.key as keyof typeof settings] as boolean}
                onChange={(e) => setSettings({ ...settings, [feature.key]: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-[#2A2A38] bg-[#12121A] text-[#7C3AED] focus:ring-[#7C3AED] focus:ring-offset-0"
              />
              <div className="flex-1">
                <label htmlFor={feature.key} className="text-sm font-medium text-[#E8E8F0] cursor-pointer block mb-1">
                  {feature.label}
                </label>
                <p className="text-xs text-[#8B8B9E]">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings & Bans */}
      <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#E8E8F0] mb-1">Warnings & Bans</h3>
          <p className="text-sm text-[#8B8B9E]">Configure user warning and ban policies</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-[#E8E8F0] mb-2 block">Warning Limit</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.warning_limit}
              onChange={(e) => setSettings({ ...settings, warning_limit: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
            />
            <p className="text-xs text-[#8B8B9E] mt-1">Warnings before auto-ban</p>
          </div>

          <div>
            <label className="text-sm font-medium text-[#E8E8F0] mb-2 block">Warning Window (hours)</label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.warning_window_hours}
              onChange={(e) => setSettings({ ...settings, warning_window_hours: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
            />
            <p className="text-xs text-[#8B8B9E] mt-1">Time window for warnings</p>
          </div>

          <div>
            <label className="text-sm font-medium text-[#E8E8F0] mb-2 block">Ban Duration (hours)</label>
            <input
              type="number"
              min="1"
              max="720"
              value={settings.ban_duration_hours}
              onChange={(e) => setSettings({ ...settings, ban_duration_hours: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
            />
            <p className="text-xs text-[#8B8B9E] mt-1">Auto-ban duration</p>
          </div>
        </div>
      </div>

      {/* Default Models */}
      <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#E8E8F0] mb-1">Default Models</h3>
          <p className="text-sm text-[#8B8B9E]">Configure AI model preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[#E8E8F0] mb-2 block">Groq Model</label>
            <select
              value={settings.default_groq_model}
              onChange={(e) => setSettings({ ...settings, default_groq_model: e.target.value })}
              className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
            >
              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              <option value="llama-3.1-70b-versatile">Llama 3.1 70B</option>
              <option value="gemma2-9b-it">Gemma 2 9B</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[#E8E8F0] mb-2 block">Mistral Model</label>
            <select
              value={settings.default_mistral_model}
              onChange={(e) => setSettings({ ...settings, default_mistral_model: e.target.value })}
              className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
            >
              <option value="mistral-large-latest">Mistral Large</option>
              <option value="mistral-small-latest">Mistral Small</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[#E8E8F0] mb-2 block">Embedding Model</label>
            <select
              value={settings.embedding_model}
              onChange={(e) => setSettings({ ...settings, embedding_model: e.target.value })}
              className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
            >
              <option value="text-embedding-3-small">text-embedding-3-small</option>
              <option value="text-embedding-3-large">text-embedding-3-large</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[#E8E8F0] mb-2 block">Fallback Model</label>
            <select
              value={settings.fallback_model}
              onChange={(e) => setSettings({ ...settings, fallback_model: e.target.value })}
              className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#E8E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
            >
              <option value="mistral-large-latest">Mistral Large</option>
              <option value="llama-3.1-70b-versatile">Llama 3.1 70B</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
