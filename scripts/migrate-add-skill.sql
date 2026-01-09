-- Migration: Add skill field to Resource table
-- This replaces the tags field with a required skill enum field

-- Step 1: Create the ResourceSkill enum type
DO $$ BEGIN
    CREATE TYPE "ResourceSkill" AS ENUM ('GRAMMAR', 'VOCABULARY', 'READING', 'WRITING', 'SPEAKING', 'LISTENING', 'TESTS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add the skill column (nullable first, we'll update values then make it required)
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "skill" "ResourceSkill";

-- Step 3: Update existing resources
-- All resources default to GRAMMAR except Placement Test which should be TESTS
UPDATE "Resource" 
SET "skill" = CASE 
    WHEN LOWER("title") LIKE '%placement test%' THEN 'TESTS'::"ResourceSkill"
    ELSE 'GRAMMAR'::"ResourceSkill"
END
WHERE "skill" IS NULL;

-- Step 4: Make skill column required (NOT NULL)
ALTER TABLE "Resource" ALTER COLUMN "skill" SET NOT NULL;

-- Step 5: Remove the tags column (optional - uncomment if you want to remove it)
-- ALTER TABLE "Resource" DROP COLUMN IF EXISTS "tags";
