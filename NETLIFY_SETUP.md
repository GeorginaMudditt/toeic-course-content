# Netlify Deployment Setup

This document outlines the environment variables and configuration needed to deploy this application to Netlify.

## Required Environment Variables

You need to set the following environment variables in your Netlify site settings:

### 1. Database Connection
- **Variable Name**: `DATABASE_URL`
- **Value**: Your Supabase PostgreSQL connection string (use the **Connection Pooling** connection string from Supabase)
- **How to get it**: 
  1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ulrwcortyhassmytkcij/settings/database)
  2. Under "Connection string" → Select "Connection pooling" (port 6543)
  3. Copy the connection string (starts with `postgresql://postgres...`)
  4. Replace `[YOUR-PASSWORD]` with your actual database password

### 2. NextAuth Secret
- **Variable Name**: `NEXTAUTH_SECRET`
- **Value**: A random secret string (generate with: `openssl rand -base64 32`)
- **How to generate locally**:
  ```bash
  openssl rand -base64 32
  ```
- Copy the generated string and use it as the value

### 3. NextAuth URL
- **Variable Name**: `NEXTAUTH_URL`
- **Value**: Your Netlify site URL (e.g., `https://your-site-name.netlify.app`)
- **Note**: Update this if you set up a custom domain

### 4. Supabase Public URL (Optional - has default)
- **Variable Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://ulrwcortyhassmytkcij.supabase.co`
- **Note**: This has a default value in code, but it's good practice to set it explicitly

### 5. Supabase Anon Key (Required)
- **Variable Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anonymous/public key
- **How to get it**: 
  1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ulrwcortyhassmytkcij/settings/api)
  2. Under "Project API keys" → Copy the `anon` `public` key
- **Important**: This is required for the vocabulary challenges to work

## How to Set Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add a variable** for each variable listed above
4. Enter the variable name and value
5. Click **Save**

## Build Settings

Make sure your build settings are:
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: `20.x` (should be detected automatically from `package.json` engines field)

## After Setting Environment Variables

1. **Trigger a new deployment**:
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Clear cache and deploy site**

2. Wait for the build to complete

3. Your site should now work properly!

## Troubleshooting

### "Application error" after deployment
- Check that all required environment variables are set
- Verify the `DATABASE_URL` connection string is correct (use Connection Pooling port 6543)
- Check the Netlify build logs for specific error messages

### Database connection errors
- Ensure `DATABASE_URL` uses the Connection Pooling string (port 6543, not 5432)
- Verify your Supabase database password is correct
- Check that your Supabase project allows connections from Netlify's IP addresses

### Authentication not working
- Verify `NEXTAUTH_SECRET` is set and matches between deployments
- Ensure `NEXTAUTH_URL` matches your actual Netlify site URL
- Check that you're using HTTPS URLs (Netlify provides HTTPS by default)

