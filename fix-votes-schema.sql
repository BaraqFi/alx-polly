-- Fix votes table schema to match application code
-- Run this in Supabase SQL Editor

-- First, check what columns currently exist in votes table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'votes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns to votes table if they don't exist
ALTER TABLE votes ADD COLUMN IF NOT EXISTS poll_id UUID REFERENCES polls(id) ON DELETE CASCADE;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS option_index INTEGER;

-- If the columns exist with different names, we might need to rename them
-- Common alternative names that might exist:
-- poll_id might be called: pollId, poll_uuid, pollid
-- user_id might be called: userId, user_uuid, userid  
-- option_index might be called: optionIndex, option_idx, choice_index, choice

-- Check if we need to rename existing columns
-- (Uncomment and modify these if needed based on what you find)

-- ALTER TABLE votes RENAME COLUMN pollId TO poll_id;
-- ALTER TABLE votes RENAME COLUMN userId TO user_id;
-- ALTER TABLE votes RENAME COLUMN optionIndex TO option_index;

-- Verify the final structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'votes' AND table_schema = 'public'
ORDER BY ordinal_position;
