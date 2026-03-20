-- ============================================================================
-- Migration: Add CourseNoteRevision table (audit history + recovery)
-- ============================================================================
-- Creates a revision log for course notes so overwrites are no longer permanent.
-- Designed for the existing service-role based API (does not rely on client RLS).
--
-- Usage:
--   Copy/paste into Supabase SQL editor (idempotent).
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."CourseNoteRevision" (
  "id" TEXT NOT NULL,
  "courseNoteId" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  -- Helps with debugging concurrency conflicts (ISO timestamps from the app).
  "expectedUpdatedAt" TIMESTAMP(3),
  CONSTRAINT "CourseNoteRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CourseNoteRevision_courseNoteId_fkey"
    FOREIGN KEY ("courseNoteId") REFERENCES "CourseNote"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT "CourseNoteRevision_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CourseNoteRevision_enrollmentId_createdAt_idx"
  ON "public"."CourseNoteRevision" ("enrollmentId", "createdAt");

-- ============================================================================
-- RLS (security best practice)
-- ============================================================================
ALTER TABLE "public"."CourseNoteRevision" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can access all course note revisions" ON "public"."CourseNoteRevision";
CREATE POLICY "Service role can access all course note revisions"
  ON "public"."CourseNoteRevision"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access course note revisions" ON "public"."CourseNoteRevision";
CREATE POLICY "Anon cannot access course note revisions"
  ON "public"."CourseNoteRevision"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

