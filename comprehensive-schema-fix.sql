-- Comprehensive Schema Fix for ALX Polly
-- Run this in Supabase SQL Editor

-- 1. Check current polls table structure
SELECT 'CURRENT POLLS TABLE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'polls' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current votes table structure  
SELECT 'CURRENT VOTES TABLE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'votes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Fix polls table - add missing columns
ALTER TABLE polls ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS options TEXT[];
ALTER TABLE polls ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE polls ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE polls ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Fix votes table - add missing columns
ALTER TABLE votes ADD COLUMN IF NOT EXISTS poll_id UUID REFERENCES polls(id) ON DELETE CASCADE;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS option_index INTEGER;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Create profiles table if it doesn't exist (for user information)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 8. Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Update existing polls to have proper values
UPDATE polls 
SET title = COALESCE(title, 'Sample Poll Title')
WHERE title IS NULL;

UPDATE polls 
SET options = COALESCE(options, ARRAY['Option 1', 'Option 2'])
WHERE options IS NULL;

UPDATE polls 
SET created_by = COALESCE(created_by, (SELECT id FROM auth.users LIMIT 1))
WHERE created_by IS NULL;

UPDATE polls 
SET is_active = COALESCE(is_active, true)
WHERE is_active IS NULL;

-- 11. Verify final structure
SELECT 'FINAL POLLS TABLE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'polls' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'FINAL VOTES TABLE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'votes' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'FINAL PROFILES TABLE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
