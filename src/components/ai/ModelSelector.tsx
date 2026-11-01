import React from 'react';
import { AI_MODELS } from '../../lib/ai/models';
import { AIModel } from '../../types/ai';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  category?: string;
}

export function ModelSelector({ selectedModel, onModelChange, category }: ModelSelectorProps) {
  const filteredModels = category 
    ? AI_MODELS.filter(model => model.category === category)
    : AI_MODELS;

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'language': return 'bg-blue-100 text-blue-800';
      case 'creative': return 'bg-purple-100 text-purple-800';
      case 'analytical': return 'bg-green-100 text-green-800';
      case 'multimodal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">AI Model</label>
      <div className="grid grid-cols-1 gap-3">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className={`
              relative rounded-lg border-2 cursor-pointer transition-all duration-200 p-4
              ${selectedModel === model.id
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => onModelChange(model.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">{model.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(model.category)}`}>
                    {model.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{model.description}</p>
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.slice(0, 3).map((capability) => (
                    <span
                      key={capability}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {capability.replace('-', ' ')}
                    </span>
                  ))}
                  {model.capabilities.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{model.capabilities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${selectedModel === model.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
                }
              `}>
                {selectedModel === model.id && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}