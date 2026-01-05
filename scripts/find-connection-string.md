# How to Find Your Supabase Connection String

## Option 1: In Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ulrwcortyhassmytkcij/settings/database
2. Look for a section called:
   - **"Connection string"** OR
   - **"Connection info"** OR
   - **"Connection pooling"**
3. It might be in a tab or dropdown menu
4. Select **"Connection Pooling"** (not "Direct connection")
5. Copy the URI string

## Option 2: Manual Construction

If you can't find it, you can construct it manually:

1. **Get your database password:**
   - On the Database Settings page, click "Reset database password"
   - Save the password securely

2. **Find your region:**
   - Check your project URL or settings
   - Common regions: `us-west-1`, `eu-west-1`, `ap-southeast-1`, `us-east-1`

3. **Construct the connection string:**
   ```
   postgresql://postgres.ulrwcortyhassmytkcij:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

   Example (if region is us-west-1):
   ```
   postgresql://postgres.ulrwcortyhassmytkcij:yourpassword123@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

## Option 3: Use Supabase CLI

If you have Supabase CLI installed:
```bash
supabase status
```
This will show your connection strings.

## Quick Test

Once you have the connection string, test it:
```bash
npm run db:generate
npm run db:push
```

If it works, you're all set!


