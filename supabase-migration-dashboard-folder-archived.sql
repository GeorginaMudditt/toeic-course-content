-- Hide student folders from the teacher dashboard without changing lifecycle status
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "dashboardFolderArchived" BOOLEAN NOT NULL DEFAULT false;
