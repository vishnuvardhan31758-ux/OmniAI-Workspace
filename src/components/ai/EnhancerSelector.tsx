import React from 'react';
import { TRANSFORMER_ENHANCERS } from '../../lib/ai/models';
import { Zap, CheckCircle } from 'lucide-react';

interface EnhancerSelectorProps {
  selectedEnhancers: string[];
  onEnhancersChange: (enhancers: string[]) => void;
}

export function EnhancerSelector({ selectedEnhancers, onEnhancersChange }: EnhancerSelectorProps) {
  const toggleEnhancer = (enhancerId: string) => {
    if (selectedEnhancers.includes(enhancerId)) {
      onEnhancersChange(selectedEnhancers.filter(id => id !== enhancerId));
    } else {
      onEnhancersChange([...selectedEnhancers, enhancerId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Zap className="w-4 h-4 text-primary-600" />
        <label className="block text-sm font-medium text-gray-700">AI Enhancers</label>
      </div>
      <p className="text-xs text-gray-500">Select enhancers to boost your content quality</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TRANSFORMER_ENHANCERS.map((enhancer) => (
          <div
            key={enhancer.id}
            className={`
              relative rounded-lg border cursor-pointer transition-all duration-200 p-3
              ${selectedEnhancers.includes(enhancer.id)
                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => toggleEnhancer(enhancer.id)}
          >
            <div className="flex items-start space-x-3">
              <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                ${selectedEnhancers.includes(enhancer.id)
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
                }
              `}>
                {selectedEnhancers.includes(enhancer.id) && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{enhancer.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{enhancer.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedEnhancers.length > 0 && (
        <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
          <p className="text-sm text-primary-700">
            <strong>{selectedEnhancers.length}</strong> enhancer{selectedEnhancers.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}