# Deployment Checklist - Student Management Features

## Step 1: Run Database Migration (REQUIRED)

The new features require database changes. You need to run the SQL migration on your **production Supabase database**.

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/ulrwcortyhassmytkcij
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the contents of `scripts/add-student-management-features.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify the migration succeeded (you should see "Success. No rows returned")

### Option B: Using Command Line

If you have `psql` installed and your `DATABASE_URL` environment variable set:

```bash
psql $DATABASE_URL -f scripts/add-student-management-features.sql
```

**Important**: Make sure you're using your **production** database connection string, not a local one.

## Step 2: Trigger Netlify Deployment

Even though code was pushed to GitHub, you may need to manually trigger a deployment:

### Option A: Wait for Auto-Deploy (if enabled)
- Netlify should automatically detect the GitHub push and rebuild
- Check the **Deploys** tab in Netlify to see if a new deploy is in progress

### Option B: Manual Deploy Trigger
1. Go to your Netlify site dashboard
2. Click on the **Deploys** tab
3. Click **Trigger deploy** → **Clear cache and deploy site**
4. Wait for the build to complete (usually 2-5 minutes)

### What Netlify Build Does:
- Runs `npm ci` to install dependencies
- Runs `prisma generate` (via postinstall script) to generate Prisma client
- Runs `npm run build` to build the Next.js app
- Deploys the `.next` directory

## Step 3: Verify the Changes

After the deployment completes, check:

1. **Student View Button**: 
   - Go to Teacher → Students → Manage a student
   - You should see a blue "Student View" button next to Edit/Delete

2. **Last Seen Information**:
   - On the same page, below the student's email
   - Should show "Last seen at [time] on [date]" or "Never logged in"

3. **Notes Tab**:
   - On the manage student page, you should see "Assignments" and "Notes" tabs
   - Click "Notes" tab to access the notes editor

4. **Student Dashboard**:
   - Log in as a student
   - You should see a new "My Notes" card on the dashboard

## Troubleshooting

### Changes still not showing after deployment?

1. **Hard refresh your browser**: 
   - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

2. **Check Netlify build logs**:
   - Go to Deploys → Click on the latest deploy → View build log
   - Look for any errors, especially:
     - Prisma generation errors
     - Build errors
     - Missing environment variables

3. **Verify database migration ran**:
   - Go to Supabase → Table Editor
   - Check if `User` table has `lastSeenAt` column
   - Check if `CourseNote` table exists

4. **Clear browser cache**:
   - Sometimes old JavaScript is cached
   - Try an incognito/private window

### Database errors?

- Make sure the migration SQL ran successfully
- Check that you're using the production database (not local)
- Verify the `DATABASE_URL` environment variable in Netlify is correct

### Build errors?

- Check that all new files were committed to GitHub
- Verify `package.json` has all dependencies
- Check Netlify build logs for specific error messages

## Quick Verification Commands

To verify the migration ran successfully, you can check in Supabase:

1. **Check User table**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'User' AND column_name = 'lastSeenAt';
   ```

2. **Check CourseNote table exists**:
   ```sql
   SELECT * FROM "CourseNote" LIMIT 1;
   ```

If these queries work, the migration was successful!
