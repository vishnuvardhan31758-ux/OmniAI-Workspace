import React from 'react';
import { TransformerConfig } from '../../types/ai';
import { Settings, Sliders } from 'lucide-react';

interface AdvancedSettingsProps {
  config: TransformerConfig;
  onConfigChange: (config: TransformerConfig) => void;
}

export function AdvancedSettings({ config, onConfigChange }: AdvancedSettingsProps) {
  const updateConfig = (updates: Partial<TransformerConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Settings className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-700">Advanced Settings</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Temperature ({config.temperature})
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Conservative</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-500">Creative</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Max Tokens ({config.maxTokens})
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Short</span>
            <input
              type="range"
              min="500"
              max="4000"
              step="100"
              value={config.maxTokens}
              onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-500">Long</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          System Prompt (Optional)
        </label>
        <textarea
          value={config.systemPrompt || ''}
          onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
          placeholder="Add custom instructions for the AI..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={3}
        />
      </div>

      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Sliders className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">Configuration Summary</span>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Model: <span className="font-medium">{config.model}</span></div>
          <div>Temperature: <span className="font-medium">{config.temperature}</span></div>
          <div>Max Tokens: <span className="font-medium">{config.maxTokens}</span></div>
          <div>Enhancers: <span className="font-medium">{config.enhancers?.length || 0}</span></div>
        </div>
      </div>
    </div>
  );
}