-- Optional note from the teacher, visible to the student on My Docs
ALTER TABLE "StudentDocument"
  ADD COLUMN IF NOT EXISTS "studentNote" TEXT;
