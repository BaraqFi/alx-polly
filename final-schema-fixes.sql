-- Final Schema Fixes for ALX Polly
-- Run this in Supabase SQL Editor

-- 1. Fix votes table foreign key constraints
ALTER TABLE votes 
ADD CONSTRAINT fk_votes_poll_id 
FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE;

ALTER TABLE votes 
ADD CONSTRAINT fk_votes_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Make option_id nullable since we're using option_index
ALTER TABLE votes ALTER COLUMN option_id DROP NOT NULL;

-- 3. Add foreign key constraint to polls.created_by
ALTER TABLE polls 
ADD CONSTRAINT fk_polls_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Update existing polls to use title instead of question (if question has data)
UPDATE polls 
SET title = COALESCE(title, question)
WHERE title IS NULL AND question IS NOT NULL;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- 6. Verify final structure
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
