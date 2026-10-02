-- Hide the upcoming-lessons panel for students who do not book with a code.
-- Course hours stay on the dashboard. Run in the portal Supabase SQL editor.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "upcomingLessonsHidden" BOOLEAN NOT NULL DEFAULT false;
