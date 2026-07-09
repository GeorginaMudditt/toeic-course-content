-- Resource section bookmarks (student favorites within a worksheet)
CREATE TABLE IF NOT EXISTS "ResourceBookmark" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "sectionSlug" TEXT NOT NULL,
    "sectionLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceBookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ResourceBookmark_studentId_assignmentId_sectionSlug_key"
    ON "ResourceBookmark"("studentId", "assignmentId", "sectionSlug");

CREATE INDEX IF NOT EXISTS "ResourceBookmark_studentId_createdAt_idx"
    ON "ResourceBookmark"("studentId", "createdAt");

ALTER TABLE "ResourceBookmark" ADD CONSTRAINT "ResourceBookmark_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResourceBookmark" ADD CONSTRAINT "ResourceBookmark_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResourceBookmark" ADD CONSTRAINT "ResourceBookmark_resourceId_fkey"
    FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
