/*
  # Add decrypt function for edge runtime

  This adds a decrypt function that can be used in edge functions
  to decrypt API keys stored in the database.
*/

CREATE OR REPLACE FUNCTION decrypt_api_key_edge(encrypted_text text, user_id uuid)
RETURNS text AS $$
DECLARE
  encryption_key bytea;
  decrypted bytea;
BEGIN
  -- Use the same key derivation as the encrypt function
  -- In production, use Supabase Vault or a proper KMS
  encryption_key := digest(user_id::text || 'your-server-secret-change-in-production', 'sha256');
  decrypted := decrypt(decode(encrypted_text, 'base64'), encryption_key, 'aes');
  RETURN convert_from(decrypted, 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Failed to decrypt API key for user %: %', user_id, SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION decrypt_api_key_edge(text, uuid) TO service_role;