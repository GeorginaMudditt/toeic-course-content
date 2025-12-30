# Supabase Setup Guide

## Your Existing Project

You're using the Supabase project:
- **Project Name**: Brizzle
- **Project ID**: ulrwcortyhassmytkcij

## Step 1: Get Your Connection String

1. Go to your Supabase project: [Brizzle](https://supabase.com/dashboard/project/ulrwcortyhassmytkcij)
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection String**
4. Select **Connection Pooling** (recommended for serverless/Next.js)
5. Copy the connection string - it will look like:
   ```
   postgresql://postgres.ulrwcortyhassmytkcij:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
   
   **Note**: Replace `[YOUR-PASSWORD]` with your database password (the one you set when creating the project, or reset it in Settings → Database if you don't remember it)

## Step 2: Configure Environment Variables

Create a `.env` file in the root of your project:

```env
# Supabase Database Connection (Connection Pooling)
# Replace [YOUR-PASSWORD] with your actual database password
DATABASE_URL="postgresql://postgres.ulrwcortyhassmytkcij:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**Important Notes:**
- Replace `[YOUR-PASSWORD]` with the database password you set when creating the project
- Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
- For production, update `NEXTAUTH_URL` to your production domain

## Step 3: Set Up the Database Schema

Run these commands to generate Prisma client and push the schema:

```bash
npm run db:generate
npm run db:push
```

This will create all the necessary tables in your Supabase database.

## Step 4: Run the Setup Script

```bash
npm run setup
```

This creates:
- A teacher account: `hello@brizzle-english.com` / `X-press129`
- Four courses: 15, 30, 45, and 60 hours

## Production Deployment

For production, use migrations instead of `db:push`:

```bash
npm run db:migrate:deploy
```

## Connection String Types

- **Connection Pooling** (port 6543): Use for your application (Next.js API routes)
- **Direct Connection** (port 5432): Use for migrations and Prisma Studio

You can find both in Settings → Database → Connection String.

## Troubleshooting

### Connection Issues
- Make sure you're using the **Connection Pooling** string for the app
- Check that your IP is allowed in Supabase (Settings → Database → Connection Pooling)
- Verify your password is correct

### Migration Issues
- For migrations, you might need to use the direct connection string temporarily
- Make sure your Supabase project is fully provisioned before running migrations

