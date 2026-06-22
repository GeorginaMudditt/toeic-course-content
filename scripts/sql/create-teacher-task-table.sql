-- Run in Supabase SQL editor (or via prisma db push) to create the teacher task list table.

CREATE TABLE IF NOT EXISTS "TeacherTask" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeacherTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TeacherTask_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TeacherTask_teacherId_status_idx" ON "TeacherTask"("teacherId", "status");
CREATE INDEX IF NOT EXISTS "TeacherTask_teacherId_status_sortOrder_idx" ON "TeacherTask"("teacherId", "status", "sortOrder");
