-- Final fix: Ensure no INSERT triggers and check for Supabase auto-triggers
-- Run this in Supabase SQL Editor

-- Step 1: Check for any INSERT triggers (there shouldn't be any)
SELECT 
    trigger_name,
    event_manipulation,  -- Should NOT be 'INSERT'
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'VocabularyProgress'
AND event_manipulation = 'INSERT';

-- Step 2: Drop ALL possible triggers (including any Supabase auto-generated ones)
DROP TRIGGER IF EXISTS update_vocabularyprogress_updated_at ON "VocabularyProgress";
DROP TRIGGER IF EXISTS set_public_vocabularyprogress_updated_at ON "VocabularyProgress";
DROP TRIGGER IF EXISTS update_updated_at_column ON "VocabularyProgress";
DROP TRIGGER IF EXISTS handle_updated_at ON "VocabularyProgress";
DROP TRIGGER IF EXISTS on_updated_at ON "VocabularyProgress";

-- Step 3: Ensure the function uses camelCase and handles both INSERT and UPDATE safely
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update updatedAt if the column exists (for UPDATE operations)
    -- For INSERT, let the DEFAULT handle it
    IF TG_OP = 'UPDATE' THEN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Create ONLY UPDATE trigger (never INSERT)
CREATE TRIGGER update_vocabularyprogress_updated_at
    BEFORE UPDATE ON "VocabularyProgress"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Verify no INSERT triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'VocabularyProgress';

-- Step 6: Test that defaults work by checking column defaults
SELECT 
    column_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'VocabularyProgress'
AND column_name IN ('createdAt', 'updatedAt');
