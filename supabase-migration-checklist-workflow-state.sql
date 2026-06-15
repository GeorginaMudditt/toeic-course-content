-- Optional workflow progress for checklist items (e.g. language assessment pre-enrollment steps)
ALTER TABLE "StudentOnboardingChecklistItem"
  ADD COLUMN IF NOT EXISTS "workflowState" JSONB;
