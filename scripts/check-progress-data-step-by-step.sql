-- ============================================
-- Step-by-Step: Check Vocabulary Progress Data
-- ============================================
-- Run each query ONE AT A TIME to see the results
-- Copy and paste each query separately into Supabase SQL Editor

-- STEP 1: See all your progress records
-- This shows you every record in the table
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
ORDER BY "updatedAt" DESC;

-- STEP 2: Check for "Animals" topic specifically
-- Replace 'Animal' with your actual topic name if different
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
WHERE topic ILIKE '%animal%'
ORDER BY "updatedAt" DESC;

-- STEP 3: Check for duplicates (CRITICAL!)
-- If this returns ANY rows, you have duplicate records that need to be merged
SELECT 
    "studentId",
    level,
    topic,
    COUNT(*) as how_many_duplicates,
    STRING_AGG(id::text, ', ') as record_ids
FROM "VocabularyProgress"
GROUP BY "studentId", level, topic
HAVING COUNT(*) > 1;

-- STEP 4: See the exact topic names (check for whitespace issues)
SELECT 
    topic,
    LENGTH(topic) as character_count,
    bronze,
    silver,
    gold
FROM "VocabularyProgress"
ORDER BY topic;
