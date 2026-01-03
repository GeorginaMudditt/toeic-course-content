# Quick Fix: Create VocabularyProgress Table

## The Problem
The error `relation "public.VocabularyProgress" does not exist` means the database table is missing. This prevents vocabulary progress from being saved or loaded.

## Solution: Create the Table in Supabase

### Step-by-Step Instructions:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in to your account
   - Select your project (the one connected to your Netlify app)

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click the "New query" button (top right)

3. **Copy and Paste This SQL:**

```sql
-- Create VocabularyProgress table
CREATE TABLE IF NOT EXISTS "VocabularyProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "bronze" BOOLEAN NOT NULL DEFAULT false,
    "silver" BOOLEAN NOT NULL DEFAULT false,
    "gold" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyProgress_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint (one progress record per student/level/topic)
CREATE UNIQUE INDEX IF NOT EXISTS "VocabularyProgress_studentId_level_topic_key"
ON "VocabularyProgress"("studentId", "level", "topic");

-- Create foreign key to User table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'VocabularyProgress_studentId_fkey'
    ) THEN
        ALTER TABLE "VocabularyProgress" ADD CONSTRAINT "VocabularyProgress_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Create trigger function for updatedAt (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updatedAt
DROP TRIGGER IF EXISTS update_vocabularyprogress_updated_at ON "VocabularyProgress";
CREATE TRIGGER update_vocabularyprogress_updated_at BEFORE UPDATE ON "VocabularyProgress"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. **Run the Query**
   - Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)
   - You should see "Success. No rows returned" or similar success message

5. **Verify the Table Was Created**
   - In the SQL Editor, run this query:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'VocabularyProgress';
   ```
   - You should see `VocabularyProgress` in the results

6. **Test the Application**
   - Go back to your application
   - Refresh the vocabulary page
   - Complete a challenge
   - The medal icons should now appear!

## What This Table Does

The `VocabularyProgress` table stores:
- Which student completed which challenges
- For which vocabulary level and topic
- Whether bronze, silver, and gold challenges are completed
- When challenges were completed

Without this table, the application cannot save or retrieve progress, which is why the icons don't appear.
