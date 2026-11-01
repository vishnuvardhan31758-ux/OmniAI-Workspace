import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { History as HistoryIcon, Heart, Copy, Trash2, Filter } from 'lucide-react';

interface Generation {
  id: string;
  tool_type: string;
  input_text: string;
  output_text: string;
  created_at: string;
  is_favorite: boolean;
}

export function History() {
  const [generations] = useState<Generation[]>([
    {
      id: '1',
      tool_type: 'generate',
      input_text: 'Write a blog post about sustainable living practices',
      output_text: 'Sustainable living has become increasingly important in our modern world...',
      created_at: '2024-01-20T10:30:00Z',
      is_favorite: true,
    },
    {
      id: '2',
      tool_type: 'rewrite',
      input_text: 'Our company provides innovative solutions for businesses looking to grow.',
      output_text: 'We deliver cutting-edge solutions that empower businesses to achieve exceptional growth and success.',
      created_at: '2024-01-19T15:45:00Z',
      is_favorite: false,
    },
    {
      id: '3',
      tool_type: 'summarize',
      input_text: 'Long article about climate change impacts and mitigation strategies...',
      output_text: '• Climate change poses significant global challenges\n• Mitigation requires coordinated international efforts\n• Technology and policy solutions are available',
      created_at: '2024-01-18T09:15:00Z',
      is_favorite: false,
    },
    {
      id: '4',
      tool_type: 'translate',
      input_text: 'Welcome to our platform. We hope you enjoy your experience.',
      output_text: 'Bienvenido a nuestra plataforma. Esperamos que disfrutes tu experiencia.',
      created_at: '2024-01-17T14:20:00Z',
      is_favorite: true,
    },
  ]);

  const [filter, setFilter] = useState('all');

  const toolLabels = {
    generate: 'Generate',
    rewrite: 'Rewrite',
    summarize: 'Summarize',
    translate: 'Translate',
  };

  const filteredGenerations = generations.filter(gen => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return gen.is_favorite;
    return gen.tool_type === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generation History</h1>
          <p className="text-gray-600">View and manage your AI-generated content history</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All</option>
            <option value="favorites">Favorites</option>
            <option value="generate">Generate</option>
            <option value="rewrite">Rewrite</option>
            <option value="summarize">Summarize</option>
            <option value="translate">Translate</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredGenerations.map((generation) => (
          <Card key={generation.id} className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  generation.tool_type === 'generate' ? 'bg-primary-100 text-primary-600' :
                  generation.tool_type === 'rewrite' ? 'bg-secondary-100 text-secondary-600' :
                  generation.tool_type === 'summarize' ? 'bg-accent-100 text-accent-600' :
                  'bg-warning-100 text-warning-600'
                }`}>
                  <HistoryIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {toolLabels[generation.tool_type as keyof typeof toolLabels]}
                  </h3>
                  <p className="text-sm text-gray-500">{formatDate(generation.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(generation.output_text)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Copy output"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    generation.is_favorite 
                      ? 'text-error-500 hover:text-error-600 bg-error-50' 
                      : 'text-gray-400 hover:text-error-500 hover:bg-error-50'
                  }`}
                  title={generation.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${generation.is_favorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Input:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 line-clamp-2">
                  {generation.input_text}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Output:</h4>
                <div className="text-sm text-gray-800 bg-white border rounded-lg p-3 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">
                    {generation.output_text.length > 200 
                      ? generation.output_text.substring(0, 200) + '...' 
                      : generation.output_text
                    }
                  </pre>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredGenerations.length === 0 && (
        <div className="text-center py-16">
          <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No generations yet' : `No ${filter} generations`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Start creating content with our AI tools to see your history here'
              : 'Try creating some content or adjust your filter'
            }
          </p>
        </div>
      )}
    </div>
  );
}