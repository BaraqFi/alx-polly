-- Diagnostic Queries to Check Current Database Schema
-- Run these in your Supabase SQL Editor to see what exists

-- Check if polls table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'polls'
ORDER BY ordinal_position;

-- Check if votes table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'votes'
ORDER BY ordinal_position;

-- Check all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if RLS is enabled on polls table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'polls';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('polls', 'votes');
