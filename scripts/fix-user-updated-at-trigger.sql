-- ============================================
-- Fix User Table updatedAt Trigger
-- ============================================
-- This script fixes the trigger on the User table that's trying to access
-- 'updated_at' (snake_case) when the column is actually 'updatedAt' (camelCase)
--
-- Run this in Supabase SQL Editor

-- Step 1: Check if trigger exists and what it does
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'User';

-- Step 2: Drop the existing trigger if it exists (if it's broken)
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";

-- Step 3: Create a new trigger function that uses the correct column name
CREATE OR REPLACE FUNCTION update_user_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Create the trigger
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at_column();

-- Step 5: Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'User';
