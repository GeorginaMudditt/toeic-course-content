-- Central contact list (students, parents, enquiries, and other contacts).
-- Teacher-only via the service role. Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS "Brizzle_contacts" (
    "id" BIGSERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Brizzle_contacts_category_idx"
ON "Brizzle_contacts" ("category");

CREATE INDEX IF NOT EXISTS "Brizzle_contacts_name_idx"
ON "Brizzle_contacts" ("name");

ALTER TABLE "public"."Brizzle_contacts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can access all contacts" ON "public"."Brizzle_contacts";
CREATE POLICY "Service role can access all contacts"
  ON "public"."Brizzle_contacts"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access contacts" ON "public"."Brizzle_contacts";
CREATE POLICY "Anon cannot access contacts"
  ON "public"."Brizzle_contacts"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
