import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RewriteRequest {
  text: string;
  style: string;
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

    const body: RewriteRequest = await req.json();
    const { text, style, model, temperature, maxTokens } = body;

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

    const systemPrompt = buildRewritePrompt(style);
    let rewrittenContent: string;

    switch (config.provider) {
      case 'openai':
        rewrittenContent = await callOpenAI(config, model || config.defaultModel || 'gpt-4o', systemPrompt, text, temperature, maxTokens);
        break;
      case 'gemini':
        rewrittenContent = await callGemini(config, model || config.defaultModel || 'gemini-1.5-pro', systemPrompt, text, temperature, maxTokens);
        break;
      case 'nvidia':
        rewrittenContent = await callNVIDIA(config, model || config.defaultModel || 'nvidia/nemotron-3-ultra-550b-a55b', systemPrompt, text, temperature, maxTokens);
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }

    // Save rewrite to database
    await supabase.from('generations').insert({
      user_id: user.id,
      tool_type: 'rewrite',
      input_text: text,
      output_text: rewrittenContent,
      metadata: { style, model: model || config.defaultModel, provider: config.provider }
    });

    return new Response(JSON.stringify({ 
      content: rewrittenContent,
      success: true,
      provider: config.provider,
      model: model || config.defaultModel
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('AI rewrite error:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

function buildRewritePrompt(style: string): string {
  const styleInstructions: Record<string, string> = {
    'improve': 'Improve clarity, flow, and engagement while preserving the original meaning. Fix any grammatical issues, enhance word choice, and improve structure.',
    'simplify': 'Make the content simpler and more accessible. Use shorter sentences, common words, and clearer explanations. Reduce jargon.',
    'formal': 'Rewrite in a formal, professional tone suitable for business or academic contexts. Use precise language and structured presentation.',
    'casual': 'Rewrite in a conversational, friendly tone. Use contractions, simpler language, and a more relaxed style.',
    'expand': 'Expand the content with more detail, examples, and depth. Add supporting information while maintaining the core message.',
    'shorten': 'Condense the content to its essential points. Remove redundancy while keeping key information and impact.',
    'persuasive': 'Rewrite to be more compelling and persuasive. Use stronger arguments, emotional appeals, and clear calls to action.',
    'technical': 'Rewrite for a technical audience. Use precise terminology, include technical details, and maintain accuracy.',
  };

  const instruction = styleInstructions[style] || styleInstructions['improve'];

  return `You are an expert editor and rewriter. ${instruction}

Provide the complete rewritten content. Do not include explanations, notes, or the original text in your response. Just provide the polished, rewritten version.`;
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
      temperature: temperature ?? 0.7,
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
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nText to rewrite:\n${userText}` }] }],
      generationConfig: {
        temperature: temperature ?? 0.7,
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
      temperature: temperature ?? 0.7,
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