-- Same migration for the root-level supabase-migration-* convention.

CREATE TABLE IF NOT EXISTS "TeacherSocialPost" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "plannedDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeacherSocialPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TeacherSocialPost_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TeacherSocialPost_teacherId_status_idx"
  ON "TeacherSocialPost"("teacherId", "status");

CREATE INDEX IF NOT EXISTS "TeacherSocialPost_teacherId_status_sortOrder_idx"
  ON "TeacherSocialPost"("teacherId", "status", "sortOrder");

CREATE INDEX IF NOT EXISTS "TeacherSocialPost_teacherId_status_plannedDate_idx"
  ON "TeacherSocialPost"("teacherId", "status", "plannedDate");
