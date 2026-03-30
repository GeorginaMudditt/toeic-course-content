# Update Placement Test on Production (brisle-courses.com)

The placement test **content** is stored in Supabase. Your **deployed site** (brisle-courses.com) uses the Supabase project configured in **Netlify’s environment variables**. To fix missing answers on the live site, you must run the update script against **that** Supabase project.

**Easiest workflow:** Put the same production credentials in your project `.env.local` once (Step 1). Then run `./update-all-resources.sh` anytime—or ask the assistant to run it—and the live site gets the updates. No need to fetch env vars from Netlify each time.

Follow these steps.

---

## Step 1: Get production Supabase credentials from Netlify

1. Log in to **Netlify**: [https://app.netlify.com](https://app.netlify.com)
2. Open the site that serves **brisle-courses.com**.
3. Go to **Site configuration** → **Environment variables** (or **Site settings** → **Build & deploy** → **Environment**).
4. Find and note the **values** (use “Show” / “Reveal” if needed) for:
   - **`NEXT_PUBLIC_SUPABASE_URL`** (e.g. `https://xxxxxxxx.supabase.co`)
   - **`SUPABASE_SERVICE_ROLE_KEY`** (long string starting with `eyJ...`)

Keep these secret. Do not commit them or share them in chat/email. You’ll use them only in your terminal in the next step.

---

## Step 2: Open Terminal and go to the project

```bash
cd /Users/georginamudditt/Desktop/brizzle/brizzle-toeic-course-content
```

(Use your actual path if different.)

---

## Step 3: Run the update script with production credentials

Run the script with the **production** URL and service role key so it updates the **same** database the live site uses.

**On Mac/Linux (replace the placeholder values with your real ones):**

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
npx tsx scripts/update-resource-supabase.ts "Placement Test" "placement-test-html.html"
```

**Example (fake values):**

```bash
NEXT_PUBLIC_SUPABASE_URL="https://abcdefgh.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
npx tsx scripts/update-resource-supabase.ts "Placement Test" "placement-test-html.html"
```

You should see something like:

```
Updating resource: "Placement Test"...
✅ Successfully updated resource!
   Resource ID: ...
   Title: Placement Test
   Content length: 26959 characters
```

If you see an error (e.g. “Resource not found” or “Permission denied”), the URL or key is wrong or the resource doesn’t exist in that project. Double‑check the values from Netlify.

---

## Step 4: Confirm what’s in the production database (optional)

Using the **same** production credentials, run the verification script:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
npx tsx scripts/verify-placement-test-in-db.ts
```

You should see all content checks as ✓ and content length around 26959 characters.

---

## Step 5: Refresh the live site and open the placement test

1. In your browser, go to **https://brisle-courses.com/teacher/resources**
2. Do a **hard refresh** so the page isn’t cached:
   - **Mac:** `Cmd + Shift + R`
   - **Windows/Linux:** `Ctrl + Shift + R`
3. Open the **Placement Test** resource (click it to open the preview).
4. Scroll to **Answers** and **Audio Transcripts**. You should see:
   - Listening answers (e.g. Photograph 1: **C**, Conversation 1: **1. A, 2. B, 3. A**, etc.)
   - Reading answers (Incomplete Sentences, Reading Comprehension)
   - Full audio transcripts under “Audio Transcripts”

If you still see headings but no content, try:

- Opening the placement test in a **private/incognito** window, or  
- Clearing the site’s cache in Netlify: **Site configuration** → **Build & deploy** → **Post processing** → **Clear cache and retry deploy** (or trigger a new deploy).

---

## Summary

| Step | Action |
|------|--------|
| 1 | Copy `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Netlify env vars |
| 2 | `cd` to your project folder |
| 3 | Run the update script with those two variables set in the same command |
| 4 | (Optional) Run the verify script with the same variables |
| 5 | Hard refresh brisle-courses.com and open the Placement Test again |

You do **not** need to push to GitHub or redeploy for the answers to appear; the live app reads from Supabase on each request. Updating the production Supabase database is enough.

---

## Update ALL resources on production

**Recommended:** Ensure `.env.local` has the same credentials as Netlify (Step 1). To push **every** HTML resource (grammar, vocabulary, speaking, tests) to the live site’s database in one go—for example after changing font sizes across all resources—use the same production credentials with the batch script:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
./update-all-resources.sh
```

The script uses `.env.local` and updates production. You can run it or ask the assistant to run it.

**Alternative (without storing credentials in .env.local):** Run with credentials in the command:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
./update-all-resources.sh
```
