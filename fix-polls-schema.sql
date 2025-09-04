-- Add missing columns to polls table
-- Run this in Supabase SQL Editor

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'polls' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add the missing options column
ALTER TABLE polls ADD COLUMN IF NOT EXISTS options TEXT[];

-- Add any other missing columns that might be needed
ALTER TABLE polls ADD COLUMN IF NOT EXISTS question TEXT;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have default values
UPDATE polls 
SET options = ARRAY['Option 1', 'Option 2'] 
WHERE options IS NULL;

UPDATE polls 
SET question = 'Sample Question' 
WHERE question IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'polls' AND table_schema = 'public'
ORDER BY ordinal_position;
