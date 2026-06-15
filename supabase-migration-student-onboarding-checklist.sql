-- Student onboarding checklist items (one row per student per checklist step)
CREATE TABLE IF NOT EXISTS "StudentOnboardingChecklistItem" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "itemSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "completedAt" TIMESTAMP(3),
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentOnboardingChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentOnboardingChecklistItem_studentId_itemSlug_key"
    ON "StudentOnboardingChecklistItem"("studentId", "itemSlug");

CREATE INDEX IF NOT EXISTS "StudentOnboardingChecklistItem_studentId_idx"
    ON "StudentOnboardingChecklistItem"("studentId");

ALTER TABLE "StudentOnboardingChecklistItem" ADD CONSTRAINT "StudentOnboardingChecklistItem_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
