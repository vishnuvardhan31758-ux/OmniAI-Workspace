import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ConfigRequest {
  provider: 'openai' | 'gemini' | 'nvidia';
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  isActive: boolean;
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

    if (req.method === 'GET') {
      // Get user's configs
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .select('provider, base_url, default_model, is_active, created_at, updated_at')
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ configs: data }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (req.method === 'POST') {
      const body: ConfigRequest = await req.json();
      const { provider, apiKey, baseUrl, defaultModel, isActive } = body;

      if (!apiKey || !provider || !defaultModel) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Validate the API key by testing connection
      const isValid = await testProviderConnection(provider, apiKey, baseUrl);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid API key or connection failed" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Encrypt the API key (in production, use Supabase Vault or proper KMS)
      // For now, we'll use a simple encryption
      const encryptedKey = await encryptApiKey(apiKey, user.id);

      // If setting as active, deactivate other configs for this user
      if (isActive) {
        await supabase
          .from('ai_provider_configs')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }

      // Upsert config
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .upsert({
          user_id: user.id,
          provider,
          api_key_encrypted: encryptedKey,
          base_url: baseUrl,
          default_model: defaultModel,
          is_active: isActive,
        }, {
          onConflict: 'user_id,provider'
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        config: {
          provider: data.provider,
          base_url: data.base_url,
          default_model: data.default_model,
          is_active: data.is_active,
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const provider = url.searchParams.get('provider');
      
      if (!provider) {
        return new Response(JSON.stringify({ error: "Provider required" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const { error } = await supabase
        .from('ai_provider_configs')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('AI config error:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

async function testProviderConnection(provider: string, apiKey: string, baseUrl?: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai': {
        const res = await fetch(`${baseUrl || 'https://api.openai.com/v1'}/models`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        return res.ok;
      }
      case 'gemini': {
        const res = await fetch(`${baseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models?key=${apiKey}`);
        return res.ok;
      }
      case 'nvidia': {
        const res = await fetch(`${baseUrl || 'https://integrate.api.nvidia.com/v1'}/models`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        return res.ok;
      }
    }
  } catch {
    return false;
  }
  return false;
}

// Simple encryption using Web Crypto API (for edge runtime)
async function encryptApiKey(plaintext: string, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId + 'server-secret-change-in-production'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('omni-ai-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}