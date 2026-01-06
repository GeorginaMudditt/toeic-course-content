-- Fix VocabularyProgress table triggers
-- This script checks and fixes any triggers that might be using wrong column names
-- Run this in Supabase SQL Editor

-- Step 1: Check all trigger functions that might affect VocabularyProgress
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND (p.proname LIKE '%updated%' OR p.proname LIKE '%vocabulary%');

-- Step 2: Check if there's a default updated_at trigger function
-- Supabase might have a default one that uses snake_case
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%updated%' OR routine_name LIKE '%trigger%');

-- Step 3: Drop any problematic triggers on VocabularyProgress
DROP TRIGGER IF EXISTS update_vocabularyprogress_updated_at ON "VocabularyProgress";
DROP TRIGGER IF EXISTS set_public_vocabularyprogress_updated_at ON "VocabularyProgress";

-- Step 4: Ensure the trigger function uses correct camelCase column name
CREATE OR REPLACE FUNCTION update_vocabularyprogress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create trigger ONLY for UPDATE (not INSERT)
-- INSERT should use the DEFAULT value, not a trigger
CREATE TRIGGER update_vocabularyprogress_updated_at
    BEFORE UPDATE ON "VocabularyProgress"
    FOR EACH ROW
    EXECUTE FUNCTION update_vocabularyprogress_updated_at();

-- Step 6: Verify the trigger was created correctly
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'VocabularyProgress';
