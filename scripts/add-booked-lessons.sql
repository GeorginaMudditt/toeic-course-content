-- Lessons booked on the Brizzle English website, copied into the student portal.
-- Run in the portal Supabase SQL editor.

CREATE TABLE IF NOT EXISTS "BookedLesson" (
  id TEXT PRIMARY KEY,
  "websiteLessonId" TEXT NOT NULL UNIQUE,
  "studentEmail" TEXT NOT NULL,
  "studentName" TEXT,
  "lessonDate" DATE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "lessonType" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "BookedLesson_studentEmail_lessonDate_idx"
  ON "BookedLesson" ("studentEmail", "lessonDate");
