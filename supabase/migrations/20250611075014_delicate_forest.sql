/*
  # Add Admin System

  1. New Tables
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `role` (text, enum: 'admin', 'user')
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles, nullable)

  2. Security
    - Enable RLS on user_roles table
    - Add policies for role management
    - Create function to check if user is admin

  3. Admin Setup
    - Set gadapabunny@gmail.com as admin when they sign up
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Admins can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can read their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = is_admin.user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign admin role to specific email
CREATE OR REPLACE FUNCTION assign_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'gadapabunny@gmail.com' THEN
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (NEW.id, 'admin', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Assign regular user role
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (NEW.id, 'user', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail profile creation
    RAISE LOG 'Error assigning role for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to assign roles when profile is created
DROP TRIGGER IF EXISTS assign_user_role ON profiles;
CREATE TRIGGER assign_user_role
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_admin_role();

-- Add index for performance
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_admin_role() TO service_role;

-- Add admin column to profiles view (optional helper)
CREATE OR REPLACE VIEW profiles_with_roles AS
SELECT 
  p.*,
  COALESCE(
    (SELECT array_agg(ur.role) FROM user_roles ur WHERE ur.user_id = p.id),
    ARRAY['user']::text[]
  ) as roles,
  is_admin(p.id) as is_admin
FROM profiles p;

-- Grant access to the view
GRANT SELECT ON profiles_with_roles TO authenticated;