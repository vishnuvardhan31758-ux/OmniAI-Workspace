/*
  # Fix User Registration Issues

  1. Database Functions
    - Fix handle_new_user function to handle edge cases
    - Improve error handling in trigger functions
    - Ensure proper permissions

  2. Security
    - Maintain existing RLS policies
    - Fix any permission issues

  3. Changes
    - Update trigger functions with better error handling
    - Ensure all required fields have proper defaults
    - Fix any constraint issues
*/

-- Drop existing functions and recreate them with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.assign_admin_role() CASCADE;

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with proper error handling
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create improved assign_admin_role function
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign role based on email
  IF NEW.email = 'gadapabunny@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (NEW.id, 'admin', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (NEW.id, 'user', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE LOG 'Error assigning role for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS assign_user_role ON public.profiles;
CREATE TRIGGER assign_user_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_admin_role() TO service_role;

-- Make sure the profiles table allows for empty full_name temporarily
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'full_name' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;
    ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT '';
  END IF;
END $$;

-- Update the profiles table to handle edge cases better
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name' AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT 'User';
  END IF;
END $$;

-- Ensure email has a default as well
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email' AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN email SET DEFAULT '';
  END IF;
END $$;