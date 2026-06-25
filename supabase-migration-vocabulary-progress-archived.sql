-- Hide students from the Vocabulary Challenge Progress view without changing lifecycle status
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "vocabularyProgressArchived" BOOLEAN NOT NULL DEFAULT false;
