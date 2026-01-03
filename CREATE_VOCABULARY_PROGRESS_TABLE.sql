-- ============================================
-- Create VocabularyProgress Table
-- ============================================
-- Run this in Supabase SQL Editor if the table doesn't exist
-- Go to: https://supabase.com/dashboard/project/[your-project-id]/editor
-- Click "New query" and paste this entire script, then click "Run"

-- Create VocabularyProgress table
CREATE TABLE IF NOT EXISTS "VocabularyProgress" (
    "id" TEXT NOT NULL,
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

-- Create unique constraint (one progress record per student/level/topic combination)
CREATE UNIQUE INDEX IF NOT EXISTS "VocabularyProgress_studentId_level_topic_key"
ON "VocabularyProgress"("studentId", "level", "topic");

-- Create foreign key to User table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'VocabularyProgress_studentId_fkey'
    ) THEN
        ALTER TABLE "VocabularyProgress" ADD CONSTRAINT "VocabularyProgress_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Create trigger function for updatedAt (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updatedAt
DROP TRIGGER IF EXISTS update_vocabularyprogress_updated_at ON "VocabularyProgress";
CREATE TRIGGER update_vocabularyprogress_updated_at BEFORE UPDATE ON "VocabularyProgress"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done! The VocabularyProgress table has been created.
-- You can verify by running: SELECT * FROM "VocabularyProgress" LIMIT 1;
