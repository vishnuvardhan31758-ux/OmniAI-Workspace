import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface GenerateRequest {
  prompt: string;
  contentType: string;
  tone: string;
  length: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enhancers?: string[];
  userId?: string;
}

interface AIProviderConfig {
  provider: 'openai' | 'gemini' | 'nvidia';
  apiKey: string;
  baseUrl?: string;
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

    const body: GenerateRequest = await req.json();
    const { prompt, contentType, tone, length, model, temperature, maxTokens, enhancers } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
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

    // Build system prompt based on content type, tone, length, enhancers
    const systemPrompt = buildSystemPrompt(contentType, tone, length, enhancers || []);
    const userPrompt = prompt;

    let generatedContent: string;

    switch (config.provider) {
      case 'openai':
        generatedContent = await callOpenAI(config, model || 'gpt-4o', systemPrompt, userPrompt, temperature, maxTokens);
        break;
      case 'gemini':
        generatedContent = await callGemini(config, model || 'gemini-1.5-pro', systemPrompt, userPrompt, temperature, maxTokens);
        break;
      case 'nvidia':
        generatedContent = await callNVIDIA(config, model || 'nvidia/nemotron-3-ultra-550b-a55b', systemPrompt, userPrompt, temperature, maxTokens);
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }

    // Save generation to database
    await supabase.from('generations').insert({
      user_id: user.id,
      tool_type: 'generate',
      input_text: prompt,
      output_text: generatedContent,
      metadata: { contentType, tone, length, model: model || config.default_model, provider: config.provider }
    });

    return new Response(JSON.stringify({ 
      content: generatedContent,
      success: true,
      provider: config.provider,
      model: model || config.default_model
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('AI generation error:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

function buildSystemPrompt(contentType: string, tone: string, length: string, enhancers: string[]): string {
  const lengthGuide = {
    'short': 'concise (200-400 words)',
    'medium': 'moderate (500-1000 words)',
    'long': 'comprehensive (1500-2500 words)',
    'very-long': 'extensive (3000+ words)'
  };

  const toneGuide = {
    'professional': 'formal, authoritative, and business-appropriate',
    'casual': 'conversational, friendly, and approachable',
    'creative': 'imaginative, expressive, and engaging',
    'academic': 'scholarly, precise, and well-structured',
    'persuasive': 'compelling, convincing, and action-oriented',
    'technical': 'precise, detailed, and technically accurate'
  };

  let prompt = `You are an expert content creator. Generate high-quality ${contentType.replace('-', ' ')} content.

Requirements:
- Tone: ${toneGuide[tone as keyof typeof toneGuide] || tone}
- Length: ${lengthGuide[length as keyof typeof lengthGuide] || length}
- Content Type: ${contentType.replace('-', ' ')}

`;

  if (enhancers.length > 0) {
    const enhancerDescriptions: Record<string, string> = {
      'tone-optimizer': 'Optimize the tone for the target audience',
      'seo-enhancer': 'Include relevant keywords naturally for search optimization',
      'readability-improver': 'Use clear structure, short paragraphs, and accessible language',
      'fact-checker': 'Ensure factual accuracy and cite sources where appropriate',
      'creativity-booster': 'Add unique perspectives, analogies, and creative elements',
      'structure-optimizer': 'Use clear headings, bullet points, and logical flow'
    };

    prompt += "Enhancements to apply:\n";
    enhancers.forEach(e => {
      if (enhancerDescriptions[e]) {
        prompt += `- ${enhancerDescriptions[e]}\n`;
      }
    });
    prompt += "\n";
  }

  prompt += `Provide complete, well-structured, publication-ready content. Do not use placeholder text. Include proper formatting with headings and sections where appropriate.`;

  return prompt;
}

async function callOpenAI(config: AIProviderConfig, model: string, systemPrompt: string, userPrompt: string, temperature?: number, maxTokens?: number): Promise<string> {
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
        { role: 'user', content: userPrompt }
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

async function callGemini(config: AIProviderConfig, model: string, systemPrompt: string, userPrompt: string, temperature?: number, maxTokens?: number): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Request: ${userPrompt}` }] }],
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

async function callNVIDIA(config: AIProviderConfig, model: string, systemPrompt: string, userPrompt: string, temperature?: number, maxTokens?: number): Promise<string> {
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
        { role: 'user', content: userPrompt }
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