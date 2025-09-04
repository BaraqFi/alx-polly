-- Check existing polls data structure
-- Run this in Supabase SQL Editor

SELECT 
  id,
  question,
  options,
  created_by,
  is_active,
  created_at
FROM polls 
LIMIT 5;
