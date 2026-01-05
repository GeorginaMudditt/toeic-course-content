-- ============================================
-- Verify VocabularyProgress Table Setup
-- ============================================
-- Run this in Supabase SQL Editor to verify the table is set up correctly
-- Go to: https://supabase.com/dashboard/project/[your-project-id]/editor
-- Click "New query" and paste this entire script, then click "Run"

-- 1. Check if the table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'VocabularyProgress';

-- 2. Check the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'VocabularyProgress'
ORDER BY ordinal_position;

-- 3. Check constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public."VocabularyProgress"'::regclass;

-- 4. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'VocabularyProgress';

-- 5. Check for any existing data (sample)
SELECT 
    id,
    "studentId",
    level,
    topic,
    bronze,
    silver,
    gold,
    "completedAt",
    "createdAt",
    "updatedAt"
FROM "VocabularyProgress"
ORDER BY "updatedAt" DESC
LIMIT 10;

-- 6. Check for duplicate entries (should be none due to unique constraint)
SELECT 
    "studentId",
    level,
    topic,
    COUNT(*) as count
FROM "VocabularyProgress"
GROUP BY "studentId", level, topic
HAVING COUNT(*) > 1;

-- 7. Check data types of boolean columns (should all be boolean)
SELECT 
    topic,
    bronze,
    silver,
    gold,
    pg_typeof(bronze) as bronze_type,
    pg_typeof(silver) as silver_type,
    pg_typeof(gold) as gold_type
FROM "VocabularyProgress"
LIMIT 5;

-- 8. Check for any NULL values in boolean columns (should be none)
SELECT 
    COUNT(*) as null_bronze_count
FROM "VocabularyProgress"
WHERE bronze IS NULL;

SELECT 
    COUNT(*) as null_silver_count
FROM "VocabularyProgress"
WHERE silver IS NULL;

SELECT 
    COUNT(*) as null_gold_count
FROM "VocabularyProgress"
WHERE gold IS NULL;

-- 9. Sample query to see progress for a specific topic (replace 'Animals' with your topic)
-- This helps verify topic name matching
SELECT 
    id,
    "studentId",
    level,
    topic,
    bronze,
    silver,
    gold,
    "updatedAt"
FROM "VocabularyProgress"
WHERE topic LIKE '%Animal%'  -- Adjust this to match your topic
ORDER BY "updatedAt" DESC;

-- 10. Check if the trigger for updatedAt is working
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'VocabularyProgress';
