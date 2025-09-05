-- Fix votes table to match application code
-- Run this in Supabase SQL Editor

-- Add foreign key constraints to votes table
ALTER TABLE votes 
ADD CONSTRAINT fk_votes_poll_id 
FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE;

ALTER TABLE votes 
ADD CONSTRAINT fk_votes_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- The option_id column exists but we're not using it in the code
-- We can either remove it or keep it for future use
-- For now, let's keep it but make it nullable since we're using option_index
ALTER TABLE votes ALTER COLUMN option_id DROP NOT NULL;

-- Verify the final votes table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'votes' AND table_schema = 'public'
ORDER BY ordinal_position;
