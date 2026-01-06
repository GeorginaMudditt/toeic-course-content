-- Comprehensive check for all triggers and functions that might affect VocabularyProgress
-- Run this in Supabase SQL Editor

-- Check ALL triggers (not just on VocabularyProgress)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'VocabularyProgress'
ORDER BY trigger_name;

-- Check ALL functions that might be related
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%updated%' 
    OR routine_name LIKE '%vocabulary%'
    OR routine_name LIKE '%trigger%'
)
ORDER BY routine_name;

-- Check if there are any RLS policies that might be interfering
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'VocabularyProgress';

-- Check table constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'VocabularyProgress'::regclass;
