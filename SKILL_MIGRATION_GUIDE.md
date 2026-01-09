# Skill Field Migration Guide

This guide explains how to migrate from the `tags` field to the new required `skill` field for resources.

## Changes Made

1. **Prisma Schema**: Added `ResourceSkill` enum and replaced `tags` with required `skill` field
2. **New Resource Page**: Replaced tags input with skill dropdown (required)
3. **Edit Resource Page**: Replaced tags input with skill dropdown (required)
4. **Resources List**: Added skill filtering alongside level filtering
5. **API Routes**: Updated to handle `skill` instead of `tags`

## Migration Steps

### Step 1: Run SQL Migration

Run the SQL migration to add the skill column to your Supabase database:

```sql
-- You can run this in Supabase SQL Editor or via psql
-- File: scripts/migrate-add-skill.sql
```

Or execute the SQL file:
```bash
# If you have psql access
psql $DATABASE_URL -f scripts/migrate-add-skill.sql
```

The SQL will:
- Create the `ResourceSkill` enum type
- Add the `skill` column to the `Resource` table
- Set all existing resources to `GRAMMAR` (except Placement Test → `TESTS`)
- Make the column required (NOT NULL)

### Step 2: Run TypeScript Migration (Optional)

If you prefer to use the TypeScript script instead:

```bash
npm run migrate:add-skill
```

This will update all existing resources:
- All resources → `GRAMMAR`
- Placement Test → `TESTS`

### Step 3: Push Code Changes

After running the migration, push the code changes:

```bash
git add .
git commit -m "Add skill field to resources with filtering"
git push origin main
```

## Skill Options

The available skills are:
- **GRAMMAR** - Grammar exercises and lessons
- **VOCABULARY** - Vocabulary building activities
- **READING** - Reading comprehension exercises
- **WRITING** - Writing practice and prompts
- **SPEAKING** - Speaking activities and prompts
- **LISTENING** - Listening comprehension exercises
- **TESTS** - Assessment tests (e.g., Placement Test)

## Notes

- The `tags` column is still in the database but is no longer used in the UI
- You can optionally remove it later by uncommenting the DROP COLUMN line in the SQL migration
- All new resources **must** have a skill selected (it's required)
- Existing resources will be set to `GRAMMAR` by default (except Placement Test)
