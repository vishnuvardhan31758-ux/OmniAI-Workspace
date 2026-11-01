import OpenAI from 'openai';

class OpenAIClient {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Try to get API key from localStorage first, then environment variables
    this.apiKey = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY;
    
    if (this.apiKey && this.apiKey !== 'your_openai_api_key_here' && this.apiKey.startsWith('sk-')) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    // Store in localStorage for persistence
    localStorage.setItem('openai_api_key', apiKey);
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey !== null && this.apiKey.startsWith('sk-');
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  async generateContent(prompt: string, options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not configured. Please set your API key.');
    }

    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt
    } = options;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    try {
      const completion = await this.client.chat.completions.create({
        model: this.mapModel(model),
        messages,
        temperature: Math.max(0, Math.min(2, temperature)),
        max_tokens: Math.max(1, Math.min(4000, maxTokens)),
        stream: false
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      return content;
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      
      // Provide more specific error messages
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else {
        throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}`);
      }
    }
  }

  private mapModel(modelId: string): string {
    const modelMap: Record<string, string> = {
      'gpt-4-turbo': 'gpt-4-turbo-preview',
      'gpt-4': 'gpt-4',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      'claude-3-opus': 'gpt-4-turbo-preview', // Fallback to GPT-4
      'gemini-pro': 'gpt-4-turbo-preview', // Fallback to GPT-4
      'creative-writer': 'gpt-4-turbo-preview',
      'analytical-mind': 'gpt-4'
    };

    return modelMap[modelId] || 'gpt-3.5-turbo';
  }

  async generateStreamContent(prompt: string, options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    onChunk?: (chunk: string) => void;
  } = {}): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not configured. Please set your API key.');
    }

    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt,
      onChunk
    } = options;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    try {
      const stream = await this.client.chat.completions.create({
        model: this.mapModel(model),
        messages,
        temperature: Math.max(0, Math.min(2, temperature)),
        max_tokens: Math.max(1, Math.min(4000, maxTokens)),
        stream: true
      });

      let fullContent = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          if (onChunk) {
            onChunk(content);
          }
        }
      }

      return fullContent;
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      throw new Error(`Failed to generate streaming content: ${error.message}`);
    }
  }
}

export const openaiClient = new OpenAIClient();