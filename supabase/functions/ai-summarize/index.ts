import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SummarizeRequest {
  text: string;
  summaryType: 'bullet-points' | 'paragraph' | 'key-takeaways' | 'executive-summary' | 'outline' | 'abstract';
  summaryLength: 'short' | 'medium' | 'long' | 'very-long';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIProviderConfig {
  provider: 'openai' | 'gemini' | 'nvidia';
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body: SummarizeRequest = await req.json();
    const { text, summaryType, summaryLength, model, temperature, maxTokens } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get user's AI provider config
    const { data: config, error: configError } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ 
        error: "No AI provider configured. Please add your API keys in settings.",
        requiresSetup: true 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const systemPrompt = buildSummarizePrompt(summaryType, summaryLength);
    let summarizedContent: string;

    switch (config.provider) {
      case 'openai':
        summarizedContent = await callOpenAI(config, model || config.default_model || 'gpt-4o', systemPrompt, text, temperature, maxTokens);
        break;
      case 'gemini':
        summarizedContent = await callGemini(config, model || config.default_model || 'gemini-1.5-pro', systemPrompt, text, temperature, maxTokens);
        break;
      case 'nvidia':
        summarizedContent = await callNVIDIA(config, model || config.default_model || 'nvidia/nemotron-3-ultra-550b-a55b', systemPrompt, text, temperature, maxTokens);
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }

    // Save to database
    await supabase.from('generations').insert({
      user_id: user.id,
      tool_type: 'summarize',
      input_text: text,
      output_text: summarizedContent,
      metadata: { summaryType, summaryLength, model: model || config.default_model, provider: config.provider }
    });

    return new Response(JSON.stringify({ 
      content: summarizedContent,
      success: true,
      provider: config.provider,
      model: model || config.default_model
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('AI summarize error:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

function buildSummarizePrompt(summaryType: string, summaryLength: string): string {
  const lengthGuide = {
    'short': 'very concise (10-20% of original length)',
    'medium': 'moderate (25-35% of original length)',
    'long': 'detailed (40-50% of original length)',
    'very-long': 'comprehensive (60%+ of original length)'
  };

  const typeInstructions: Record<string, string> = {
    'bullet-points': 'Create a clear, scannable bullet-point summary with key points and sub-points',
    'paragraph': 'Write a cohesive paragraph summary that flows naturally',
    'key-takeaways': 'Extract the most important takeaways as numbered or bulleted key insights',
    'executive-summary': 'Write an executive summary with overview, key findings, and recommendations',
    'outline': 'Create a structured outline with main sections and supporting details',
    'abstract': 'Write an academic-style abstract with background, methods, results, and conclusions'
  };

  return `You are an expert summarizer. Create a ${typeInstructions[summaryType] || typeInstructions['bullet-points']} summary.

Requirements:
- Summary Type: ${summaryType.replace('-', ' ')}
- Length: ${lengthGuide[summaryLength as keyof typeof lengthGuide] || summaryLength}

Provide ONLY the summary content. Do not include explanations, notes, or meta-commentary. The summary should be accurate, complete, and well-structured.`;
}

async function callOpenAI(config: AIProviderConfig, model: string, systemPrompt: string, userText: string, temperature?: number, maxTokens?: number): Promise<string> {
  const response = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      temperature: temperature ?? 0.5,
      max_tokens: maxTokens ?? 4000,
      stream: false
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callGemini(config: AIProviderConfig, model: string, systemPrompt: string, userText: string, temperature?: number, maxTokens?: number): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nText to summarize:\n${userText}` }] }],
      generationConfig: {
        temperature: temperature ?? 0.5,
        maxOutputTokens: maxTokens ?? 4000,
        topP: 0.8,
        topK: 40
      }
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

async function callNVIDIA(config: AIProviderConfig, model: string, systemPrompt: string, userText: string, temperature?: number, maxTokens?: number): Promise<string> {
  const response = await fetch(`${config.baseUrl || 'https://integrate.api.nvidia.com/v1'}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      temperature: temperature ?? 0.5,
      max_tokens: maxTokens ?? 4000,
      stream: false
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`NVIDIA API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}