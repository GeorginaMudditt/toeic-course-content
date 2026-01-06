-- Check the actual column names in VocabularyProgress table
-- Run this in Supabase SQL Editor

-- Check column names and types
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'VocabularyProgress'
ORDER BY ordinal_position;

-- Also check if there are any constraints or defaults
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'VocabularyProgress'::regclass;
