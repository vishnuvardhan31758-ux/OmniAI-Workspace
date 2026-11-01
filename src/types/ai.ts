export interface AIModel {
  id: string;
  name: string;
  description: string;
  category: 'language' | 'creative' | 'analytical' | 'multimodal';
  capabilities: string[];
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
  };
}

export interface TransformerConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  enhancers?: string[];
}

export interface AIRequest {
  prompt: string;
  config: TransformerConfig;
  context?: {
    previousOutputs?: string[];
    userPreferences?: Record<string, any>;
    contentType?: string;
  };
}

export interface AIResponse {
  content: string;
  model: string;
  confidence: number;
  processingTime: number;
  enhancementsApplied: string[];
  suggestions?: string[];
}

export interface TransformerPipeline {
  id: string;
  name: string;
  description: string;
  steps: TransformerStep[];
  category: string;
}

export interface TransformerStep {
  id: string;
  name: string;
  transformer: string;
  config: TransformerConfig;
  order: number;
}