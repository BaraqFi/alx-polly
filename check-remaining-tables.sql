-- Check polls and votes table structure
-- Run this in Supabase SQL Editor

-- Check polls table
SELECT 'POLLS TABLE:' as table_name;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'polls' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check votes table  
SELECT 'VOTES TABLE:' as table_name;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'votes' AND table_schema = 'public'
ORDER BY ordinal_position;
