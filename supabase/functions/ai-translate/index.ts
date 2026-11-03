import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TranslateRequest {
  text: string;
  fromLang: string;
  toLang: string;
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

const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
  'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'zh': 'Chinese',
  'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'hi': 'Hindi',
  'nl': 'Dutch', 'pl': 'Polish', 'tr': 'Turkish', 'sv': 'Swedish',
  'da': 'Danish', 'no': 'Norwegian', 'fi': 'Finnish', 'cs': 'Czech',
  'hu': 'Hungarian', 'ro': 'Romanian', 'bg': 'Bulgarian', 'hr': 'Croatian',
  'sk': 'Slovak', 'sl': 'Slovenian', 'et': 'Estonian', 'lv': 'Latvian',
  'lt': 'Lithuanian', 'el': 'Greek', 'he': 'Hebrew', 'th': 'Thai',
  'vi': 'Vietnamese', 'id': 'Indonesian', 'ms': 'Malay', 'tl': 'Filipino',
};

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

    const body: TranslateRequest = await req.json();
    const { text, fromLang, toLang, model, temperature, maxTokens } = body;

    if (!text || !fromLang || !toLang) {
      return new Response(JSON.stringify({ error: "Text, fromLang, and toLang are required" }), {
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

    const systemPrompt = buildTranslatePrompt(fromLang, toLang);
    let translatedContent: string;

    switch (config.provider) {
      case 'openai':
        translatedContent = await callOpenAI(config, model || config.default_model || 'gpt-4o', systemPrompt, text, temperature, maxTokens);
        break;
      case 'gemini':
        translatedContent = await callGemini(config, model || config.default_model || 'gemini-1.5-pro', systemPrompt, text, temperature, maxTokens);
        break;
      case 'nvidia':
        translatedContent = await callNVIDIA(config, model || config.default_model || 'nvidia/nemotron-3-ultra-550b-a55b', systemPrompt, text, temperature, maxTokens);
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }

    // Save to database
    await supabase.from('generations').insert({
      user_id: user.id,
      tool_type: 'translate',
      input_text: text,
      output_text: translatedContent,
      metadata: { fromLang, toLang, model: model || config.default_model, provider: config.provider }
    });

    return new Response(JSON.stringify({ 
      content: translatedContent,
      success: true,
      provider: config.provider,
      model: model || config.default_model
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('AI translate error:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

function buildTranslatePrompt(fromLang: string, toLang: string): string {
  const fromName = LANGUAGE_NAMES[fromLang] || fromLang;
  const toName = LANGUAGE_NAMES[toLang] || toLang;

  return `You are a professional translator. Translate the following text from ${fromName} to ${toName}.

Requirements:
- Maintain the original meaning, tone, and intent
- Use natural, idiomatic ${toName}
- Preserve formatting, structure, and any technical terms
- Handle cultural nuances appropriately
- Do not add explanations or notes - provide ONLY the translation

Provide the complete translated text.`;
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
      temperature: temperature ?? 0.3,
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
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nText to translate:\n${userText}` }] }],
      generationConfig: {
        temperature: temperature ?? 0.3,
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
      temperature: temperature ?? 0.3,
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