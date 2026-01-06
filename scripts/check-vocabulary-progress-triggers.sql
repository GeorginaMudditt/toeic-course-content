-- Check triggers on VocabularyProgress table
-- Run this in Supabase SQL Editor to see what triggers exist

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'VocabularyProgress';

-- Also check the trigger function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%vocabulary%' OR routine_name LIKE '%updated%';
