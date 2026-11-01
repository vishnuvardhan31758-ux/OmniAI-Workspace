import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';

class BlackBoxClient {
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Try to get API key from localStorage first, then environment variables
    this.apiKey = localStorage.getItem('blackbox_api_key') || import.meta.env.VITE_BLACKBOX_API_KEY;
    
    if (this.apiKey && this.apiKey !== 'your_gemini_api_key_here' && this.apiKey.length > 10) {
      this.initializeClient();
    }
  }

  private initializeClient() {
    if (!this.apiKey) return;
    
    try {
      this.client = new GoogleGenerativeAI(this.apiKey);
      this.model = this.client.getGenerativeModel({ model: 'gemini-pro' });
    } catch (error) {
      console.error('Failed to initialize Black Box client:', error);
      this.client = null;
      this.model = null;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    // Store in localStorage for persistence
    localStorage.setItem('blackbox_api_key', apiKey);
    this.initializeClient();
  }

  isConfigured(): boolean {
    return this.client !== null && this.model !== null && this.apiKey !== null && this.apiKey.length > 10 && this.apiKey.startsWith('AIza');
  }

  async testConnection(): Promise<boolean> {
    if (!this.model) return false;
    
    try {
      const result = await this.model.generateContent('Hello');
      const response = await result.response;
      return response.text().length > 0;
    } catch (error) {
      console.error('Black Box connection test failed:', error);
      return false;
    }
  }

  async generateContent(prompt: string, options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Black Box client not configured. Please set your API key.');
    }

    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt
    } = options;

    try {
      // Build the full prompt with system instructions if provided
      let fullPrompt = prompt;
      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;
      }

      // Configure generation parameters
      const generationConfig = {
        temperature: Math.max(0, Math.min(1, temperature)),
        maxOutputTokens: Math.max(1, Math.min(8192, maxTokens)),
        topP: 0.8,
        topK: 40,
      };

      const model = this.client!.getGenerativeModel({ 
        model: this.mapModel(options.model || 'gemini-pro'),
        generationConfig
      });

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text();

      if (!content) {
        throw new Error('No content generated from Gemini');
      }

      return content;
    } catch (error: any) {
      console.error('Black Box API Error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API Key not found')) {
        throw new Error('Invalid Black Box API key. Please check your configuration.');
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('Black Box API quota exceeded. Please check your billing.');
      } else if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('SAFETY')) {
        throw new Error('Content was blocked by Black Box safety filters. Please try rephrasing your request.');
      } else {
        throw new Error(`Black Box API Error: ${error.message || 'Unknown error'}`);
      }
    }
  }

  private mapModel(modelId: string): string {
    const modelMap: Record<string, string> = {
      'gpt-4-turbo': 'gemini-pro',
      'gpt-4': 'gemini-pro',
      'gpt-3.5-turbo': 'gemini-pro',
      'claude-3-opus': 'gemini-pro',
      'gemini-pro': 'gemini-pro',
      'creative-writer': 'gemini-pro',
      'analytical-mind': 'gemini-pro'
    };

    return modelMap[modelId] || 'gemini-pro';
  }

  async generateStreamContent(prompt: string, options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    onChunk?: (chunk: string) => void;
  } = {}): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Black Box client not configured. Please set your API key.');
    }

    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt,
      onChunk
    } = options;

    try {
      // Build the full prompt with system instructions if provided
      let fullPrompt = prompt;
      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;
      }

      // Configure generation parameters
      const generationConfig = {
        temperature: Math.max(0, Math.min(1, temperature)),
        maxOutputTokens: Math.max(1, Math.min(8192, maxTokens)),
        topP: 0.8,
        topK: 40,
      };

      const model = this.client!.getGenerativeModel({ 
        model: this.mapModel(options.model || 'gemini-pro'),
        generationConfig
      });

      const result = await model.generateContentStream(fullPrompt);
      let fullContent = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullContent += chunkText;
          if (onChunk) {
            onChunk(chunkText);
          }
        }
      }

      return fullContent;
    } catch (error: any) {
      console.error('Black Box API Error:', error);
      throw new Error(`Failed to generate streaming content: ${error.message}`);
    }
  }

  async generateWithChat(messages: Array<{role: 'user' | 'model', parts: string}>, options: {
    temperature?: number;
    maxTokens?: number;
  } = {}): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Black Box client not configured. Please set your API key.');
    }

    const {
      temperature = 0.7,
      maxTokens = 2000
    } = options;

    try {
      const generationConfig = {
        temperature: Math.max(0, Math.min(1, temperature)),
        maxOutputTokens: Math.max(1, Math.min(8192, maxTokens)),
        topP: 0.8,
        topK: 40,
      };

      const model = this.client!.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig
      });

      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }]
      }));

      const chat = model.startChat({ history });
      const lastMessage = messages[messages.length - 1];
      
      const result = await chat.sendMessage(lastMessage.parts);
      const response = await result.response;
      
      return response.text();
    } catch (error: any) {
      console.error('Black Box Chat API Error:', error);
      throw new Error(`Failed to generate chat response: ${error.message}`);
    }
  }
}

export const blackBoxClient = new BlackBoxClient();