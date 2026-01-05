-- ============================================
-- Quick Diagnostic: Vocabulary Progress Data
-- ============================================
-- Run this to quickly see what's happening with your progress data
-- Focus on queries that will show the actual problem

-- 1. See ALL your progress records (most important!)
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
ORDER BY "updatedAt" DESC;

-- 2. Check for duplicate entries (CRITICAL - this could be the problem!)
-- If you see any rows here, you have duplicates that need to be merged
SELECT 
    "studentId",
    level,
    topic,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as record_ids,
    STRING_AGG(bronze::text || ',' || silver::text || ',' || gold::text, ' | ') as values
FROM "VocabularyProgress"
GROUP BY "studentId", level, topic
HAVING COUNT(*) > 1;

-- 3. Check for "Animals" topic specifically (replace with your actual topic name)
SELECT 
    id,
    "studentId",
    level,
    topic,
    bronze,
    silver,
    gold,
    LENGTH(topic) as topic_length,
    "updatedAt"
FROM "VocabularyProgress"
WHERE topic ILIKE '%animal%'  -- Case-insensitive search
ORDER BY "updatedAt" DESC;

-- 4. Check data types (should all be 'boolean')
SELECT 
    topic,
    bronze,
    silver,
    gold,
    pg_typeof(bronze) as bronze_type,
    pg_typeof(silver) as silver_type,
    pg_typeof(gold) as gold_type
FROM "VocabularyProgress"
LIMIT 10;

-- 5. Count records by completion status
SELECT 
    COUNT(*) FILTER (WHERE bronze = true) as bronze_completed,
    COUNT(*) FILTER (WHERE silver = true) as silver_completed,
    COUNT(*) FILTER (WHERE gold = true) as gold_completed,
    COUNT(*) FILTER (WHERE bronze = true AND silver = true AND gold = true) as all_completed,
    COUNT(*) as total_records
FROM "VocabularyProgress";
