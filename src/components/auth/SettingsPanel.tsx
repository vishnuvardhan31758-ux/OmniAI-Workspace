import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Key, Save, TestTube, CheckCircle, AlertCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Provider = 'openai' | 'gemini' | 'nvidia';

interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  isActive: boolean;
}

const PROVIDER_MODELS: Record<Provider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  nvidia: ['nvidia/nemotron-3-ultra-550b-a55b', 'nvidia/nemotron-3.5-lightning-30b-a3b', 'nvidia/nemotron-3-super-120b-a12b'],
};

const PROVIDER_LABELS: Record<Provider, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  nvidia: 'NVIDIA',
};

const DEFAULT_MODELS: Record<Provider, string> = {
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-pro',
  nvidia: 'nvidia/nemotron-3-ultra-550b-a55b',
};

const BASE_URLS: Record<Provider, string> = {
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com',
  nvidia: 'https://integrate.api.nvidia.com/v1',
};

export function SettingsPanel({ onClose }: { onClose?: () => void }) {
  const [configs, setConfigs] = useState<Record<Provider, ProviderConfig>>({
    openai: { provider: 'openai', apiKey: '', baseUrl: BASE_URLS.openai, defaultModel: DEFAULT_MODELS.openai, isActive: false },
    gemini: { provider: 'gemini', apiKey: '', baseUrl: BASE_URLS.gemini, defaultModel: DEFAULT_MODELS.gemini, isActive: false },
    nvidia: { provider: 'nvidia', apiKey: '', baseUrl: BASE_URLS.nvidia, defaultModel: DEFAULT_MODELS.nvidia, isActive: false },
  });
  const [activeProvider, setActiveProvider] = useState<Provider>('openai');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState<Provider | null>(null);
  const [testResult, setTestResult] = useState<{ provider: Provider; success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_provider_configs')
        .select('*')
        .eq('user_id', user.id);

      if (data) {
        data.forEach((config) => {
          // Note: In production, decrypt the API key server-side
          // For now, we'll just load the config structure
          setConfigs(prev => ({
            ...prev,
            [config.provider]: {
              provider: config.provider,
              apiKey: '', // Don't load decrypted key to client
              baseUrl: config.base_url || BASE_URLS[config.provider as Provider],
              defaultModel: config.default_model,
              isActive: config.is_active,
            }
          }));
        });
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  };

  const handleSave = async (provider: Provider) => {
    const config = configs[provider];
    if (!config.apiKey.trim()) {
      setTestResult({ provider, success: false, message: 'API key is required' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Test the connection first
      const isValid = await testConnection(provider, config);
      if (!isValid) {
        setTestResult({ provider, success: false, message: 'Connection test failed' });
        return;
      }

      // In production, encrypt the API key before sending to server
      // For now, we'll use the edge function to handle encryption
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel,
          isActive: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to save config');

      setConfigs(prev => ({
        ...prev,
        [provider]: { ...config, isActive: true }
      }));

      setTestResult({ provider, success: true, message: 'Saved and activated successfully!' });
    } catch (error: any) {
      setTestResult({ provider, success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (provider: Provider) => {
    const config = configs[provider];
    if (!config.apiKey.trim()) {
      setTestResult({ provider, success: false, message: 'Enter API key first' });
      return;
    }

    setTesting(provider);
    setTestResult(null);

    try {
      const isValid = await testConnection(provider, config);
      setTestResult({ 
        provider, 
        success: isValid, 
        message: isValid ? 'Connection successful!' : 'Connection failed - check your key' 
      });
    } catch (error: any) {
      setTestResult({ provider, success: false, message: error.message });
    } finally {
      setTesting(null);
    }
  };

  const testConnection = async (provider: Provider, config: ProviderConfig): Promise<boolean> => {
    try {
      switch (provider) {
        case 'openai': {
          const res = await fetch(`${config.baseUrl}/models`, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` },
          });
          return res.ok;
        }
        case 'gemini': {
          const res = await fetch(`${config.baseUrl}/v1beta/models?key=${config.apiKey}`);
          return res.ok;
        }
        case 'nvidia': {
          const res = await fetch(`${config.baseUrl}/models`, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` },
          });
          return res.ok;
        }
      }
    } catch {
      return false;
    }
    return false;
  };

  const handleDeactivate = async (provider: Provider) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('ai_provider_configs')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('provider', provider);

      setConfigs(prev => ({
        ...prev,
        [provider]: { ...prev[provider], isActive: false }
      }));

      setTestResult({ provider, success: true, message: 'Deactivated' });
    } catch (error: any) {
      setTestResult({ provider, success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = configs[activeProvider];
  const models = PROVIDER_MODELS[activeProvider];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Provider Settings</h2>
              <p className="text-sm text-gray-600">Configure your AI API keys for content generation</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-6">
          {/* Provider Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-1" role="tablist">
              {(['openai', 'gemini', 'nvidia'] as Provider[]).map((provider) => (
                <button
                  key={provider}
                  role="tab"
                  aria-selected={activeProvider === provider}
                  onClick={() => { setActiveProvider(provider); setTestResult(null); }}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeProvider === provider
                      ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {PROVIDER_LABELS[provider]}
                </button>
              ))}
            </nav>
          </div>

          {/* Provider Config */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{PROVIDER_LABELS[activeProvider]} Configuration</h3>
                {currentConfig.isActive && (
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                )}
              </div>

              <div className="space-y-3">
                <Select
                  label="Default Model"
                  value={currentConfig.defaultModel}
                  onChange={(value) => setConfigs(prev => ({ ...prev, [activeProvider]: { ...prev[activeProvider], defaultModel: value } }))}
                  options={models.map(m => ({ value: m, label: m }))}
                />

                <div className="relative">
                  <Input
                    label="API Key"
                    type={showKey ? 'text' : 'password'}
                    placeholder={`Enter your ${PROVIDER_LABELS[activeProvider]} API key`}
                    value={currentConfig.apiKey}
                    onChange={(value) => setConfigs(prev => ({ ...prev, [activeProvider]: { ...prev[activeProvider], apiKey: value } }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Input
                  label="Base URL (Optional)"
                  placeholder={BASE_URLS[activeProvider]}
                  value={currentConfig.baseUrl}
                  onChange={(value) => setConfigs(prev => ({ ...prev, [activeProvider]: { ...prev[activeProvider], baseUrl: value } }))}
                />
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleTest(activeProvider)}
                  loading={testing === activeProvider}
                  disabled={!currentConfig.apiKey.trim() || loading}
                  variant="outline"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>

                {currentConfig.isActive ? (
                  <Button
                    onClick={() => handleDeactivate(activeProvider)}
                    loading={loading}
                    disabled={loading}
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSave(activeProvider)}
                    loading={loading}
                    disabled={!currentConfig.apiKey.trim() || loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Activate
                  </Button>
                )}
              </div>
            </div>

            {/* Test Result */}
            {testResult && testResult.provider === activeProvider && (
              <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            {/* Provider Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">How to get your {PROVIDER_LABELS[activeProvider]} API key:</h4>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                {activeProvider === 'openai' && (
                  <>
                    <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI API Keys</a></li>
                    <li>Sign in and click "Create new secret key"</li>
                    <li>Copy the key (starts with <code className="bg-blue-100 px-1 rounded">sk-</code>)</li>
                  </>
                )}
                {activeProvider === 'gemini' && (
                  <>
                    <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                    <li>Sign in and click "Create API key"</li>
                    <li>Copy the key</li>
                  </>
                )}
                {activeProvider === 'nvidia' && (
                  <>
                    <li>Visit <a href="https://build.nvidia.com/" target="_blank" rel="noopener noreferrer" className="underline">NVIDIA NGC</a></li>
                    <li>Sign in and navigate to API Keys</li>
                    <li>Create key (starts with <code className="bg-blue-100 px-1 rounded">nvapi-</code>)</li>
                  </>
                )}
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            API keys are encrypted and stored securely in Supabase. They are never exposed to the client.
          </p>
        </div>
      </Card>
    </div>
  );
}