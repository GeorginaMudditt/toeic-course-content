# Troubleshooting Login Issues

## Password Toggle Fixed
The password visibility toggle has been fixed. It should now work correctly.

## Login Not Working - Checklist

If you're still unable to log in, please verify the following in Netlify:

### 1. Environment Variables
Make sure ALL these environment variables are set in Netlify (Site settings → Environment variables):

- ✅ `DATABASE_URL` - Should be: `postgresql://postgres:924qzD3bv1Xihm8m@db.ulrwcortyhassmytkcij.supabase.co:5432/postgres`
- ✅ `NEXTAUTH_SECRET` - Should be: `WbKA9KOwsZMdUujFVkQU5QTbgBf1yKgKB0m8qLPr1Ms=`
- ✅ `NEXTAUTH_URL` - Should be your Netlify site URL (e.g., `https://your-site.netlify.app`)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Should be: `https://ulrwcortyhassmytkcij.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### 2. Verify Accounts Exist
The accounts have been verified in the database:
- **Teacher**: `hello@brizzle-english.com` / `X-press129` ✅
- **Student**: `student@example.com` / `student123` ✅

### 3. Check Netlify Function Logs
1. Go to Netlify Dashboard → Your Site → Functions
2. Check for any errors in the `/api/auth/[...nextauth]` function
3. Look for database connection errors

### 4. Common Issues

**Issue**: "Invalid email or password" even with correct credentials
- **Solution**: Check that `NEXTAUTH_SECRET` is set correctly
- **Solution**: Verify `DATABASE_URL` is correct and accessible
- **Solution**: Make sure `NEXTAUTH_URL` matches your actual Netlify site URL exactly

**Issue**: Database connection errors
- **Solution**: Verify `DATABASE_URL` uses the correct password
- **Solution**: Check that Supabase allows connections from Netlify's IP addresses

**Issue**: Session not persisting
- **Solution**: Ensure `NEXTAUTH_URL` is set to HTTPS URL (Netlify provides HTTPS by default)
- **Solution**: Check that cookies are enabled in your browser

### 5. Test Database Connection
If login still fails, the database connection might be the issue. Check Netlify function logs for Prisma connection errors.

### 6. Redeploy After Changes
After updating environment variables:
1. Go to Deploys tab
2. Click "Trigger deploy" → "Clear cache and deploy site"

