# Email Setup Guide for Password Reset

This project uses **Resend** for sending password reset emails, the same email service used in the new-brizzle-website project. We use Resend instead of Neo SMTP due to reliability and deliverability issues experienced with Neo.

## Prerequisites

You need a Resend account and API key. 

**Note**: While you can use the same API key across projects, it's recommended to create a separate API key for this project for better security and monitoring. Each project should have its own API key.

## Step 1: Get Your Resend API Key

1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name like "Brizzle TOEIC Course Content"
4. Copy the API key (starts with `re_`)

**Important**: Create a new API key specifically for this project. Do not reuse the API key from new-brizzle-website.

## Step 2: Configure Environment Variables

### Local Development (.env.local)

Add to your `.env.local` file:

```env
RESEND_API_KEY=re_your_api_key_here
NEXTAUTH_URL=http://localhost:3000
```

**⚠️ Security Note**: Never commit your `.env.local` file to git. It should already be in `.gitignore`.

### Production (Netlify)

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add a new variable:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_`)
4. Make sure `NEXTAUTH_URL` is also set to your production URL:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://toeic-course-content.netlify.app` (or your custom domain)

## Step 3: Verify Domain (If Not Already Done)

If you haven't verified `brizzle-english.com` in Resend yet:

1. Go to [Resend Domains](https://resend.com/domains)
2. Add `brizzle-english.com` as a domain
3. Add the DNS records Resend provides to your domain's DNS settings (in Netlify or your DNS provider)
4. Wait for verification (usually takes a few minutes)

**Note**: If you've already verified the domain for new-brizzle-website, you can skip this step and use the same domain.

## Step 4: Test Email Sending

1. Start your development server: `npm run dev`
2. Go to the login page
3. Click "Forgotten your password?"
4. Enter a valid user email
5. Check the user's inbox for the password reset email

## Email Configuration

The password reset emails are sent from:
- **From**: `Brizzle TOEIC® <noreply@brizzle-english.com>`
- **Subject**: `Password Reset Request - Brizzle TOEIC®`
- **Link Expiry**: 1 hour

## Troubleshooting

### Emails Not Sending

1. **Check RESEND_API_KEY is set**:
   - Verify the environment variable is set correctly
   - Check Netlify environment variables if in production
   - Look for console warnings: `⚠️ RESEND_API_KEY not found`

2. **Check Resend Dashboard**:
   - Go to [Resend Logs](https://resend.com/emails)
   - Look for any failed email attempts
   - Check error messages

3. **Check Console Logs**:
   - Look for error messages in the server logs
   - Common errors:
     - `RESEND_API_KEY not found` → Environment variable not set
     - `Domain not verified` → Need to verify domain in Resend
     - `Invalid API key` → API key is incorrect

### Emails Going to Spam

See the `EMAIL_DELIVERABILITY_GUIDE.md` in the new-brizzle-website project for detailed instructions on:
- SPF records
- DKIM records
- DMARC records
- Email content best practices

## Files Modified

- `lib/email.ts` - Email sending utility using Resend
- `app/api/auth/forgot-password/route.ts` - Updated to send emails
- `app/login/page.tsx` - Updated text to "Forgotten your password?"

## Related Documentation

- [Resend Documentation](https://resend.com/docs)
- [new-brizzle-website EMAIL_DELIVERABILITY_GUIDE.md](../new-brizzle-website/EMAIL_DELIVERABILITY_GUIDE.md)
