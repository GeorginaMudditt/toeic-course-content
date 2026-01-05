-- ============================================
-- Fix VocabularyProgress Topic Name Normalization
-- ============================================
-- This script normalizes topic names in the VocabularyProgress table
-- to ensure consistent matching (trim whitespace, normalize multiple spaces)
-- Run this in Supabase SQL Editor

-- 1. First, let's see what topic names we have (before fix)
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
ORDER BY topic, "updatedAt" DESC;

-- 2. Check for duplicate entries with different topic name variations
-- (These should be merged)
SELECT 
    "studentId",
    level,
    topic,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as record_ids
FROM "VocabularyProgress"
GROUP BY "studentId", level, TRIM(REGEXP_REPLACE(topic, '\s+', ' ', 'g'))
HAVING COUNT(*) > 1;

-- 3. Normalize all topic names (trim and normalize whitespace)
-- This updates all records to have normalized topic names
UPDATE "VocabularyProgress"
SET topic = TRIM(REGEXP_REPLACE(topic, '\s+', ' ', 'g'))
WHERE topic != TRIM(REGEXP_REPLACE(topic, '\s+', ' ', 'g'));

-- 4. After normalization, check for duplicates again
-- If duplicates exist, we need to merge them
WITH normalized_topics AS (
    SELECT 
        "studentId",
        level,
        TRIM(REGEXP_REPLACE(topic, '\s+', ' ', 'g')) as normalized_topic,
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY "updatedAt" DESC) as ids
    FROM "VocabularyProgress"
    GROUP BY "studentId", level, TRIM(REGEXP_REPLACE(topic, '\s+', ' ', 'g'))
    HAVING COUNT(*) > 1
)
SELECT * FROM normalized_topics;

-- 5. If duplicates exist, merge them by keeping the most recent record
-- and combining the boolean values (OR logic - if any record has true, keep true)
-- WARNING: This will delete duplicate records. Review the output of step 4 first!
/*
DO $$
DECLARE
    dup_record RECORD;
    keep_id TEXT;
    merged_bronze BOOLEAN;
    merged_silver BOOLEAN;
    merged_gold BOOLEAN;
BEGIN
    FOR dup_record IN (
        SELECT 
            "studentId",
            level,
            TRIM(REGEXP_REPLACE(topic, '\s+', ' ', 'g')) as normalized_topic,
            ARRAY_AGG(id ORDER BY "updatedAt" DESC) as ids,
            ARRAY_AGG(bronze ORDER BY "updatedAt" DESC) as bronze_vals,
            ARRAY_AGG(silver ORDER BY "updatedAt" DESC) as silver_vals,
            ARRAY_AGG(gold ORDER BY "updatedAt" DESC) as gold_vals
        FROM "VocabularyProgress"
        GROUP BY "studentId", level, TRIM(REGEXP_REPLACE(topic, '\s+', ' ', 'g'))
        HAVING COUNT(*) > 1
    ) LOOP
        -- Keep the first (most recent) ID
        keep_id := dup_record.ids[1];
        
        -- Merge boolean values (OR logic)
        merged_bronze := EXISTS(SELECT 1 FROM unnest(dup_record.bronze_vals) AS val WHERE val = true);
        merged_silver := EXISTS(SELECT 1 FROM unnest(dup_record.silver_vals) AS val WHERE val = true);
        merged_gold := EXISTS(SELECT 1 FROM unnest(dup_record.gold_vals) AS val WHERE val = true);
        
        -- Update the kept record with merged values
        UPDATE "VocabularyProgress"
        SET 
            bronze = merged_bronze,
            silver = merged_silver,
            gold = merged_gold,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = keep_id;
        
        -- Delete the duplicate records
        DELETE FROM "VocabularyProgress"
        WHERE "studentId" = dup_record."studentId"
            AND level = dup_record.level
            AND TRIM(REGEXP_REPLACE(topic, '\s+', ' ', 'g')) = dup_record.normalized_topic
            AND id != keep_id;
    END LOOP;
END $$;
*/

-- 6. Verify the fix - check normalized topic names
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
ORDER BY topic, "updatedAt" DESC;

-- 7. Verify no duplicates remain
SELECT 
    "studentId",
    level,
    topic,
    COUNT(*) as count
FROM "VocabularyProgress"
GROUP BY "studentId", level, topic
HAVING COUNT(*) > 1;
