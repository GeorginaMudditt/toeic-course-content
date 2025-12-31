-- Vocabulary Progress Table for storing student vocabulary challenge completion
-- Run this in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/ulrwcortyhassmytkcij/editor
-- Click "New query" and paste this entire script, then click "Run"

-- Create VocabularyProgress table
CREATE TABLE IF NOT EXISTS "VocabularyProgress" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "studentId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "bronze" BOOLEAN NOT NULL DEFAULT false,
    "silver" BOOLEAN NOT NULL DEFAULT false,
    "gold" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyProgress_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint to ensure one record per student/level/topic combination
CREATE UNIQUE INDEX IF NOT EXISTS "VocabularyProgress_studentId_level_topic_key" 
ON "VocabularyProgress"("studentId", "level", "topic");

-- Create foreign key to User table
ALTER TABLE "VocabularyProgress" 
ADD CONSTRAINT IF NOT EXISTS "VocabularyProgress_studentId_fkey" 
FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create trigger for updatedAt column (uses the same function as other tables)
DO $$ BEGIN
    CREATE TRIGGER set_public_vocabularyprogress_updated_at
    BEFORE UPDATE ON "VocabularyProgress"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
