-- Check actual database schema for both tables
-- Run this in Supabase SQL Editor

-- Check polls table structure
SELECT 
  'polls' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'polls' AND table_schema = 'public'

UNION ALL

-- Check votes table structure
SELECT 
  'votes' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'votes' AND table_schema = 'public'

ORDER BY table_name, ordinal_position;
