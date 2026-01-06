-- Complete fix for VocabularyProgress trigger issue
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check current triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'VocabularyProgress';

-- Step 2: Drop ALL triggers on VocabularyProgress (we'll recreate them correctly)
DROP TRIGGER IF EXISTS update_vocabularyprogress_updated_at ON "VocabularyProgress";
DROP TRIGGER IF EXISTS set_public_vocabularyprogress_updated_at ON "VocabularyProgress";
DROP TRIGGER IF EXISTS update_updated_at_column ON "VocabularyProgress";

-- Step 3: Fix the update_updated_at_column function to use camelCase
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Use camelCase "updatedAt" - this works for all tables with camelCase columns
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Create ONLY an UPDATE trigger (NOT INSERT)
-- INSERT should use the DEFAULT value, not a trigger
CREATE TRIGGER update_vocabularyprogress_updated_at
    BEFORE UPDATE ON "VocabularyProgress"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Verify the trigger was created correctly
SELECT 
    trigger_name,
    event_manipulation,  -- Should be 'UPDATE' only
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'VocabularyProgress';

-- Step 6: Verify the function uses correct column name
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_updated_at_column';
