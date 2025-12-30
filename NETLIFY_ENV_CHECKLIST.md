# Netlify Environment Variables Checklist

## Step-by-Step Guide to Setting Environment Variables in Netlify

### Where to Find Your Netlify Dashboard
1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Sign in to your account
3. Click on your site: **toeic-course-content** (or whatever you named it)

### How to Add Environment Variables

1. **Click on "Site settings"** (in the top navigation bar)
2. **Click on "Environment variables"** (in the left sidebar under "Build & deploy")
3. You'll see a list of environment variables (or it will be empty if you haven't added any)

### Required Environment Variables

Add each of these **one by one** by clicking the **"Add variable"** button:

#### 1. DATABASE_URL
- **Variable key**: `DATABASE_URL`
- **Variable value**: Your Supabase connection string
  - Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ulrwcortyhassmytkcij/settings/database)
  - Click on **"Connection string"** tab
  - Select **"Connection pooling"** mode
  - Copy the connection string (it will look like: `postgresql://postgres.ulrwcortyhassmytkcij:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`)
  - **IMPORTANT**: Replace `[YOUR-PASSWORD]` with your actual database password
- Click **"Save"**

#### 2. NEXTAUTH_SECRET
- **Variable key**: `NEXTAUTH_SECRET`
- **Variable value**: Generate one by running this in your terminal:
  ```bash
  openssl rand -base64 32
  ```
  Copy the output and paste it as the value
- Click **"Save"**

#### 3. NEXTAUTH_URL
- **Variable key**: `NEXTAUTH_URL`
- **Variable value**: `https://toeic-course-content.netlify.app` (or your actual Netlify site URL)
- Click **"Save"**

#### 4. NEXT_PUBLIC_SUPABASE_URL
- **Variable key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Variable value**: `https://ulrwcortyhassmytkcij.supabase.co`
- Click **"Save"**

#### 5. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Variable key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Variable value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscndjb3J0eWhhc3NteXRrY2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExODgwMDgsImV4cCI6MjA1Njc2NDAwOH0.XXtNa4UG27BSjrdT44QwafQAZ0GGa6nbGkYMRcHENis`
- Click **"Save"**

#### 6. SUPABASE_SERVICE_ROLE_KEY
- **Variable key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Variable value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscndjb3J0eWhhc3NteXRrY2lqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE4ODAwOCwiZXhwIjoyMDU2NzY0MDA4fQ.OBb-fOGrWXrqpJpo65fYbtO2YEFeozLmSiw_Z9wE7fo`
- Click **"Save"**

### After Adding All Variables

1. **Redeploy your site**:
   - Go to the **"Deploys"** tab (top navigation)
   - Click **"Trigger deploy"** dropdown
   - Click **"Clear cache and deploy site"**
   - Wait for the deployment to finish (usually 2-3 minutes)

2. **Check if it worked**:
   - Go to your site URL (e.g., https://toeic-course-content.netlify.app)
   - You should see the login page (not an error page)

## How to Check Server Logs (If Something Goes Wrong)

If you see an error page, here's how to find the server logs:

1. Go to your Netlify dashboard
2. Click on **"Deploys"** tab
3. Click on the **most recent deploy** (the one at the top)
4. You'll see the build log - scroll down to see if there are any errors

To check **runtime logs** (when the site is running):

1. Go to your Netlify dashboard
2. Click on **"Functions"** tab
3. If you see any functions listed, click on them to see logs
4. Or click on **"Logs"** in the top navigation bar
5. Try to access your site (try logging in)
6. The logs will show errors in real-time

## Quick Checklist

Make sure you have ALL of these variables set in Netlify:

- [ ] DATABASE_URL
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY

## Still Having Issues?

If you've added all the variables and redeployed but still see errors:

1. Double-check that you copied the values correctly (no extra spaces, all characters included)
2. Make sure you replaced `[YOUR-PASSWORD]` in the DATABASE_URL with your actual password
3. Check the server logs as described above
4. Take a screenshot of your environment variables list (you can hide the values if you want) and the error message
