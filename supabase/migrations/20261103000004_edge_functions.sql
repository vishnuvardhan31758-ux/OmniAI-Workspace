/*
  # Add migrations for new edge functions

  This migration adds the necessary database structure for the new
  AI edge functions (summarize, translate) and any additional tables.
*/

-- Add metadata column to generations if not exists (already added in previous migration)
-- This ensures the generations table can store metadata about the AI calls

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generations' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE generations ADD COLUMN metadata jsonb;
  END IF;
END $$;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS generations_metadata_idx ON generations USING GIN (metadata);

-- Add function to get user's active AI provider
CREATE OR REPLACE FUNCTION get_user_active_ai_provider(user_id uuid)
RETURNS TABLE (
  provider text,
  api_key_encrypted text,
  base_url text,
  default_model text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai_provider_configs.provider,
    ai_provider_configs.api_key_encrypted,
    ai_provider_configs.base_url,
    ai_provider_configs.default_model
  FROM ai_provider_configs
  WHERE ai_provider_configs.user_id = get_user_active_ai_provider.user_id
  AND ai_provider_configs.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_active_ai_provider(uuid) TO service_role;

-- Add view for user stats
CREATE OR REPLACE VIEW user_generation_stats AS
SELECT 
  g.user_id,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE g.tool_type = 'generate') as generations_count,
  COUNT(*) FILTER (WHERE g.tool_type = 'rewrite') as rewrites_count,
  COUNT(*) FILTER (WHERE g.tool_type = 'summarize') as summarizes_count,
  COUNT(*) FILTER (WHERE g.tool_type = 'translate') as translates_count,
  MAX(g.created_at) as last_generation_at
FROM generations g
GROUP BY g.user_id;

GRANT SELECT ON user_generation_stats TO authenticated;