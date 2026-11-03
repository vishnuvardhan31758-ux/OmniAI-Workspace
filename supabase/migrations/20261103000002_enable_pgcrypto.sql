/*
  # Enable pgcrypto for API key encryption

  This enables the pgcrypto extension for encrypting/decrypting API keys
  at the database level. In production, consider using Supabase Vault instead.
*/

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption/decryption functions for API keys
-- Uses a key derived from the user's ID + a server-side secret
-- In production, use Supabase Vault or a proper KMS

CREATE OR REPLACE FUNCTION encrypt_api_key(plaintext text, user_id uuid)
RETURNS text AS $$
DECLARE
  encryption_key bytea;
  encrypted bytea;
BEGIN
  -- In production, use a proper KMS or Supabase Vault
  -- This is a simple example using pgcrypto
  encryption_key := digest(user_id::text || 'your-server-secret-change-in-production', 'sha256');
  encrypted := encrypt(plaintext::bytea, encryption_key, 'aes');
  RETURN encode(encrypted, 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_text text, user_id uuid)
RETURNS text AS $$
DECLARE
  encryption_key bytea;
  decrypted bytea;
BEGIN
  encryption_key := digest(user_id::text || 'your-server-secret-change-in-production', 'sha256');
  decrypted := decrypt(decode(encrypted_text, 'base64'), encryption_key, 'aes');
  RETURN convert_from(decrypted, 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Failed to decrypt API key for user %: %', user_id, SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION encrypt_api_key(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION decrypt_api_key(text, uuid) TO service_role;