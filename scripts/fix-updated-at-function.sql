-- Fix the update_updated_at_column() function to use camelCase
-- This function is used by multiple tables including VocabularyProgress
-- Run this in Supabase SQL Editor

-- Step 1: Check the current function definition
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_updated_at_column';

-- Step 2: Drop and recreate the function with correct camelCase column name
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 3: Create the function with correct camelCase
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Use camelCase "updatedAt" instead of snake_case "updated_at"
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Verify the function was created correctly
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_updated_at_column';
