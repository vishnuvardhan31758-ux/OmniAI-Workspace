/*
  # Add AI Provider Configurations Table

  1. New Tables
    - `ai_provider_configs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `provider` (text, enum: 'openai', 'gemini', 'nvidia')
      - `api_key_encrypted` (text) - encrypted API key
      - `base_url` (text, nullable) - custom base URL for OpenAI-compatible APIs
      - `default_model` (text)
      - `is_active` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Users can only manage their own configs
    - API keys are encrypted server-side
*/

-- Create ai_provider_configs table
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('openai', 'gemini', 'nvidia')),
  api_key_encrypted text NOT NULL,
  base_url text,
  default_model text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own AI configs"
  ON ai_provider_configs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS ai_provider_configs_user_id_idx ON ai_provider_configs(user_id);
CREATE INDEX IF NOT EXISTS ai_provider_configs_is_active_idx ON ai_provider_configs(is_active);

-- Updated at trigger
CREATE TRIGGER update_ai_provider_configs_updated_at
  BEFORE UPDATE ON ai_provider_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON ai_provider_configs TO authenticated;
GRANT ALL ON ai_provider_configs TO service_role;