-- Private teacher notes + one-time course midpoint notification tracking.
-- Run in Supabase SQL Editor (or psql).

ALTER TABLE "CourseNote" ADD COLUMN IF NOT EXISTS "teacherPrivateContent" TEXT NOT NULL DEFAULT '';

ALTER TABLE "CourseNote" ADD COLUMN IF NOT EXISTS "midpointNotificationSentAt" TIMESTAMP(3);

COMMENT ON COLUMN "CourseNote"."teacherPrivateContent" IS 'Visible only in teacher portal; excluded from student My Notes.';
COMMENT ON COLUMN "CourseNote"."midpointNotificationSentAt" IS 'Set when hello@brizzle-english.com was notified that the student reached the course midpoint.';
