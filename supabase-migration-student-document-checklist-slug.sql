-- Link student portal documents to onboarding checklist items
ALTER TABLE "StudentDocument"
  ADD COLUMN IF NOT EXISTS "checklistItemSlug" TEXT;

CREATE INDEX IF NOT EXISTS "StudentDocument_studentId_checklistItemSlug_idx"
  ON "StudentDocument"("studentId", "checklistItemSlug");
