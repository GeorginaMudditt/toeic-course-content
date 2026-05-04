-- Add administrative lifecycle status for students (teacher portal).
-- Run in Supabase SQL editor or: psql $DATABASE_URL -f scripts/add-student-lifecycle-status.sql

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studentLifecycleStatus" TEXT;

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_studentLifecycleStatus_check";

ALTER TABLE "User" ADD CONSTRAINT "User_studentLifecycleStatus_check" CHECK (
  "studentLifecycleStatus" IS NULL
  OR "studentLifecycleStatus" IN ('ACTIVE_STUDENT', 'PAST_STUDENT', 'TESTING', 'EDITING')
);

UPDATE "User"
SET "studentLifecycleStatus" = 'ACTIVE_STUDENT'
WHERE "role" = 'STUDENT'
  AND ("studentLifecycleStatus" IS NULL OR TRIM("studentLifecycleStatus") = '');
