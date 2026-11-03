import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ModelSelector } from '../ai/ModelSelector';
import { EnhancerSelector } from '../ai/EnhancerSelector';
import { AdvancedSettings } from '../ai/AdvancedSettings';
import { SettingsPanel } from '../auth/SettingsPanel';
import { 
  Brain, 
  Copy, 
  Download, 
  Heart, 
  Zap, 
  TrendingUp,
  PenTool,
  RefreshCw,
  FileText,
  Languages,
  ArrowLeftRight,
  Sparkles,
  Target,
  Clock,
  Key,
  AlertTriangle,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TransformerConfig, AIResponse } from '../../types/ai';

type ToolType = 'generate' | 'rewrite' | 'summarize' | 'translate';

interface GenerationResult {
  content: string;
  success: boolean;
  provider: string;
  model: string;
}

export function UnifiedAITool() {
  const [selectedTool, setSelectedTool] = useState<ToolType>('generate');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<TransformerConfig>({
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000,
    enhancers: []
  });

  // Check if user has AI config on component mount
  useEffect(() => {
    checkApiConfiguration();
  }, []);

  const checkApiConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_provider_configs')
        .select('is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      setIsApiConfigured(!!data);
    } catch {
      setIsApiConfigured(false);
    }
  };

  const taskTypes: Record<ToolType, { label: string; icon: any; description: string }> = {
    generate: { label: 'Generate Content', icon: PenTool, description: 'Create new content from scratch' },
    rewrite: { label: 'Rewrite Content', icon: RefreshCw, description: 'Improve and refine existing content' },
    summarize: { label: 'Summarize Content', icon: FileText, description: 'Create concise summaries' },
    translate: { label: 'Translate Content', icon: Languages, description: 'Translate between languages' }
  };

  const contentTypes = [
    { value: 'blog-post', label: 'Blog Post' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'email', label: 'Email' },
    { value: 'product-description', label: 'Product Description' },
    { value: 'article', label: 'Article' },
    { value: 'marketing-copy', label: 'Marketing Copy' },
    { value: 'technical-doc', label: 'Technical Documentation' },
    { value: 'press-release', label: 'Press Release' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'landing-page', label: 'Landing Page' }
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'persuasive', label: 'Persuasive' },
    { value: 'informative', label: 'Informative' },
    { value: 'creative', label: 'Creative' },
    { value: 'formal', label: 'Formal' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'empathetic', label: 'Empathetic' }
  ];

  const lengths = [
    { value: 'short', label: 'Short (100-300 words)' },
    { value: 'medium', label: 'Medium (300-800 words)' },
    { value: 'long', label: 'Long (800-1500 words)' },
    { value: 'very-long', label: 'Very Long (1500+ words)' },
  ];

  const rewriteStyles = [
    { value: 'improve', label: 'Improve Writing Quality' },
    { value: 'simplify', label: 'Simplify Language' },
    { value: 'formal', label: 'Make More Formal' },
    { value: 'casual', label: 'Make More Casual' },
    { value: 'expand', label: 'Expand with Details' },
    { value: 'shorten', label: 'Make More Concise' },
    { value: 'professional', label: 'Professional Tone' },
    { value: 'creative', label: 'Creative Enhancement' },
    { value: 'persuasive', label: 'More Persuasive' },
    { value: 'engaging', label: 'More Engaging' }
  ];

  const summaryTypes = [
    { value: 'bullet-points', label: 'Bullet Points' },
    { value: 'paragraph', label: 'Paragraph Summary' },
    { value: 'key-takeaways', label: 'Key Takeaways' },
    { value: 'executive-summary', label: 'Executive Summary' },
    { value: 'outline', label: 'Outline Format' },
    { value: 'abstract', label: 'Abstract Style' }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'th', name: 'Thai' }
  ];

  const [contentType, setContentType] = useState('blog-post');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [rewriteStyle, setRewriteStyle] = useState('improve');
  const [summaryType, setSummaryType] = useState('bullet-points');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('es');

  const handleProcess = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setOutput('');
    setResponse(null);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let endpoint = '';
      let body: any = {};

      switch (selectedTool) {
        case 'generate':
          endpoint = 'ai-generate';
          body = {
            prompt: input,
            contentType,
            tone,
            length,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            enhancers: config.enhancers
          };
          break;
        case 'rewrite':
          endpoint = 'ai-rewrite';
          body = {
            text: input,
            style: rewriteStyle,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens
          };
          break;
        case 'summarize':
          endpoint = 'ai-summarize';
          body = {
            text: input,
            summaryType,
            summaryLength,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens
          };
          break;
        case 'translate':
          endpoint = 'ai-translate';
          body = {
            text: input,
            fromLang,
            toLang,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens
          };
          break;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data: GenerationResult = await response.json();

      if (!response.ok) {
        if (data.requiresSetup) {
          setIsApiConfigured(false);
          throw new Error('No AI provider configured. Please add your API keys in settings.');
        }
        throw new Error(data.error || 'Generation failed');
      }

      setOutput(data.content);
      setResponse({
        content: data.content,
        model: data.model,
        confidence: 0.95,
        processingTime: 0,
        enhancementsApplied: config.enhancers || [],
        suggestions: [
          'Configure different AI providers for varied results',
          'Try adjusting temperature for different creativity levels',
          'Use enhancers to improve specific aspects of the output'
        ]
      });

      // Refresh config status
      checkApiConfiguration();

    } catch (err: any) {
      console.error('Processing failed:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      
      if (errorMessage.includes('configured') || errorMessage.includes('API key')) {
        setIsApiConfigured(false);
        setOutput(`# API Configuration Required\n\n**Error**: ${errorMessage}\n\n**To resolve:**\n1. Click the Settings button (⚙️) in the header\n2. Add your OpenAI, Gemini, or NVIDIA API key\n3. Test the connection and activate\n\n*Get API keys from:*\n- OpenAI: https://platform.openai.com/api-keys\n- Gemini: https://makersuite.google.com/app/apikey\n- NVIDIA: https://build.nvidia.com/`);
      } else {
        setOutput(`# Processing Error\n\n**Error**: ${errorMessage}\n\n**Try:**\n1. Check your internet connection\n2. Verify API key configuration in Settings\n3. Try a different model or provider\n4. Refresh the page`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  const handleSwapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
  };

  const getInputLabel = () => {
    switch (selectedTool) {
      case 'generate': return 'Describe what you want to create';
      case 'rewrite': return 'Content to rewrite';
      case 'summarize': return 'Content to summarize';
      case 'translate': return 'Text to translate';
    }
  };

  const getInputPlaceholder = () => {
    switch (selectedTool) {
      case 'generate': return 'Describe the content you want to generate... (e.g., "Write about sustainable living practices for busy professionals")';
      case 'rewrite': return 'Paste your content here to rewrite it... (e.g., existing blog post, email, or article)';
      case 'summarize': return 'Paste your long-form content here to summarize... (e.g., research paper, article, or report)';
      case 'translate': return 'Enter text you want to translate... (e.g., "Welcome to our platform")';
    }
  };

  const renderTaskSpecificSettings = () => {
    switch (selectedTool) {
      case 'generate':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {contentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {tones.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {lengths.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'rewrite':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rewrite Style</label>
            <select
              value={rewriteStyle}
              onChange={(e) => setRewriteStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {rewriteStyles.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        );

      case 'summarize':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Summary Format</label>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {summaryTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
              <select
                value={summaryLength}
                onChange={(e) => setSummaryLength(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {lengths.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'translate':
        return (
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <select
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSwapLanguages}
              className="mt-6 p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              title="Swap languages"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <select
                value={toLang}
                onChange={(e) => setToLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentTask = taskTypes[selectedTool];

  return (
    <div className="space-y-6">
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <Brain className="w-8 h-8 text-primary-600" />
            <span>AI Content Studio</span>
          </h1>
          <p className="text-gray-600">Unified AI-powered content creation and enhancement platform</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowSettings(true)}
            variant="ghost"
            size="sm"
            icon={Settings}
            aria-label="AI Provider Settings"
          />
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
            isApiConfigured 
              ? 'bg-gradient-to-r from-success-50 to-primary-50 border-success-200' 
              : 'bg-gradient-to-r from-warning-50 to-error-50 border-warning-200'
          }`}>
            {isApiConfigured ? (
              <>
                <CheckCircle className="w-4 h-4 text-success-600" />
                <span className="text-sm font-medium text-success-700">AI Connected</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-warning-600" />
                <span className="text-sm font-medium text-warning-700">Configure AI</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!isApiConfigured && (
        <Card className="border-warning-200 bg-warning-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-warning-800 mb-1">AI Provider Not Configured</h3>
              <p className="text-sm text-warning-700 mb-3">
                Click the Settings button (⚙️) above to add your OpenAI, Google Gemini, or NVIDIA API key for real AI-powered content generation.
              </p>
            </div>
          </div>
        </Card>
      )}

      {error && isApiConfigured && (
        <Card className="border-error-200 bg-error-50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-error-600" />
            <div className="text-sm text-error-700">{error}</div>
          </div>
        </Card>
      )}

      {/* Task Type Selection */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-primary-600" />
          <span>Select AI Task</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(taskTypes) as [ToolType, typeof taskTypes[ToolType]][]).map(([value, task]) => (
            <button
              key={value}
              onClick={() => setSelectedTool(value)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${selectedTool === value
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${
                value === 'generate' ? 'from-blue-500 to-blue-600' :
                value === 'rewrite' ? 'from-green-500 to-green-600' :
                value === 'summarize' ? 'from-purple-500 to-purple-600' :
                'from-orange-500 to-orange-600'
              } flex items-center justify-center mb-3`}>
                <task.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{task.label}</h3>
              <p className="text-sm text-gray-600">{task.description}</p>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="xl:col-span-1 space-y-6">
          <Card>
            <ModelSelector
              selectedModel={config.model}
              onModelChange={(model) => setConfig({ ...config, model })}
            />
          </Card>

          {/* Task-specific settings */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <currentTask.icon className="w-5 h-5 text-primary-600" />
              <span>{currentTask.label} Settings</span>
            </h3>
            {renderTaskSpecificSettings()}
          </Card>

          <Card>
            <EnhancerSelector
              selectedEnhancers={config.enhancers || []}
              onEnhancersChange={(enhancers) => setConfig({ ...config, enhancers })}
            />
          </Card>

          <Card>
            <AdvancedSettings
              config={config}
              onConfigChange={setConfig}
            />
          </Card>
        </div>

        {/* Content Processing Panel */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <currentTask.icon className="w-5 h-5 text-primary-600" />
              <span>{currentTask.label}</span>
            </h2>
            
            <div className="space-y-4">
              <Textarea
                label={getInputLabel()}
                placeholder={getInputPlaceholder()}
                value={input}
                onChange={setInput}
                rows={8}
                required
              />

              <Button
                onClick={handleProcess}
                loading={loading}
                disabled={!input.trim() || loading || (selectedTool === 'translate' && fromLang === toLang)}
                icon={currentTask.icon}
                className={`w-full bg-gradient-to-r ${
                  selectedTool === 'generate' ? 'from-blue-500 to-blue-600' :
                  selectedTool === 'rewrite' ? 'from-green-500 to-green-600' :
                  selectedTool === 'summarize' ? 'from-purple-500 to-purple-600' :
                  'from-orange-500 to-orange-600'
                } hover:opacity-90`}
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  `${currentTask.label}`
                )}
              </Button>
            </div>
          </Card>

          {/* Output Panel */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>AI Output</span>
              </h2>
              {output && (
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy} icon={Copy}>
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" icon={Heart}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" icon={Download}>
                    Export
                  </Button>
                </div>
              )}
            </div>

            {response && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Provider:</span>
                    <div className="font-semibold text-gray-900">{response.model}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence:</span>
                    <div className="font-semibold text-green-600">{(response.confidence * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Task:</span>
                    <div className="font-semibold text-blue-600 capitalize">{selectedTool}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Enhancers:</span>
                    <div className="font-semibold text-purple-600">{response.enhancementsApplied.length}</div>
                  </div>
                </div>
              </div>
            )}

            {output ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 border border-gray-200 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                    {output}
                  </pre>
                </div>
                
                {response?.suggestions && response.suggestions.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>AI Suggestions:</span>
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {response.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-600">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${
                  selectedTool === 'generate' ? 'from-blue-100 to-blue-200' :
                  selectedTool === 'rewrite' ? 'from-green-100 to-green-200' :
                  selectedTool === 'summarize' ? 'from-purple-100 to-purple-200' :
                  'from-orange-100 to-orange-200'
                } rounded-full flex items-center justify-center`}>
                  <currentTask.icon className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium mb-2">AI Ready</p>
                <p>Your {currentTask.label.toLowerCase()} output will appear here</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}