-- Check which column has data in polls table
-- Run this in Supabase SQL Editor

SELECT 
  COUNT(*) as total_polls,
  COUNT(title) as polls_with_title,
  COUNT(question) as polls_with_question,
  COUNT(options) as polls_with_options
FROM polls;
