# Supabase Linter Warnings – How to Fix

This doc explains how to clear the 5 common **WARN** level linter issues.

---

## 1 & 2. Function Search Path Mutable (`check_sub_account_count`, `raw_sql`)

**What it means:** Those functions don’t have a fixed `search_path`, which can be a security concern.

**Fix (SQL):** Run the **full** `scripts/fix-supabase-linter-errors.sql` script in the Supabase **SQL Editor**. It now includes a dynamic block that sets `search_path = public, pg_temp` on `check_sub_account_count` and `raw_sql` for any argument list.

If you only want to fix these two functions, run this in the SQL Editor:

```sql
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN ('check_sub_account_count', 'raw_sql')
  LOOP
    IF r.args IS NULL OR r.args = '' THEN
      EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public, pg_temp', r.proname);
    ELSE
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp', r.proname, r.args);
    END IF;
  END LOOP;
END $$;
```

---

## 3. Auth OTP Long Expiry

**What it means:** Email OTP expiry is set to more than 1 hour. Supabase recommends under 1 hour.

**Fix (Dashboard):**

1. **Authentication** → **Providers** → **Email**
2. Find **“Confirm email”** / OTP expiry (e.g. “OTP expiry” or “Token expiry”).
3. Set it to **3600** seconds (1 hour) or less (e.g. **900** = 15 minutes, **600** = 10 minutes).
4. Save.

---

## 4. Leaked Password Protection Disabled

**What it means:** Auth is not checking passwords against HaveIBeenPwned, so compromised passwords can be used.

**Fix (Dashboard):**

1. **Authentication** → **Providers** → **Email** (or **Settings** in the Auth section).
2. Find **“Leaked password protection”** or **“Check passwords against HaveIBeenPwned”**.
3. **Enable** it.
4. Save.

Docs: [Password strength and leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

## 5. Vulnerable Postgres Version

**What it means:** Your Postgres version has security updates available (e.g. you’re on `supabase-postgres-15.8.1.044` and a patched version exists).

**Fix (Dashboard):**

1. **Project Settings** (gear) → **Infrastructure** (or **Database**).
2. Find **“Upgrade Postgres”** or **“Database version”**.
3. Follow the in-dashboard steps to upgrade (often a one-click upgrade; there may be a short maintenance window).

Docs: [Upgrading](https://supabase.com/docs/guides/platform/upgrading)

---

## Summary

| Warning                         | Where to fix        | Action                                      |
|---------------------------------|---------------------|---------------------------------------------|
| Function search_path (×2)       | SQL Editor          | Run script or the `DO $$` block above       |
| Auth OTP long expiry            | Auth → Email        | Set OTP expiry ≤ 3600 seconds               |
| Leaked password protection      | Auth → Email/Settings | Enable leaked password protection        |
| Vulnerable Postgres version     | Project Settings → Infrastructure | Upgrade Postgres version            |
