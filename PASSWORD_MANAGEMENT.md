# Password Management Features

This document describes the password change and reset functionality added to the application.

## Features

### 1. Change Password (Authenticated Users)
- **Location**: `/student/change-password` or `/teacher/change-password`
- **Access**: Available via "Change Password" link in the Navbar
- **Requirements**: User must be logged in
- **Process**:
  1. Enter current password
  2. Enter new password (minimum 6 characters)
  3. Confirm new password
  4. Password is updated in the database

### 2. Forgot Password
- **Location**: `/forgot-password`
- **Access**: "Forgot your password?" link on the login page
- **Process**:
  1. Enter email address
  2. System generates a secure reset token (if email exists)
  3. Token is saved to database with 1-hour expiration
  4. **Note**: Currently, the reset token is logged to console. In production, this should be sent via email.

### 3. Reset Password (With Token)
- **Location**: `/reset-password?token=...`
- **Access**: Via link sent in password reset email (or from console logs in development)
- **Process**:
  1. User clicks reset link with token
  2. Enter new password (minimum 6 characters)
  3. Confirm new password
  4. Password is updated and token is cleared
  5. User is redirected to login page

## Database Changes

The `User` table now includes two new fields:
- `resetToken` (TEXT, nullable): Stores the secure token for password reset
- `resetTokenExpiry` (TIMESTAMP, nullable): Stores when the token expires

### Setup

Run the SQL script to add these fields:
```bash
# In Supabase SQL Editor, run:
scripts/add-password-reset-fields.sql
```

Or update Prisma schema and push:
```bash
npm run db:push
```

## API Routes

### POST `/api/auth/change-password`
- **Authentication**: Required (session)
- **Body**: `{ currentPassword: string, newPassword: string }`
- **Response**: `{ success: boolean, message: string }`

### POST `/api/auth/forgot-password`
- **Authentication**: Not required
- **Body**: `{ email: string }`
- **Response**: `{ success: boolean, message: string }`
- **Security**: Always returns success to prevent email enumeration

### POST `/api/auth/reset-password`
- **Authentication**: Not required (uses token)
- **Body**: `{ token: string, newPassword: string }`
- **Response**: `{ success: boolean, message: string }`

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt (10 rounds)
2. **Token Security**: Reset tokens are cryptographically secure (32 random bytes)
3. **Token Expiration**: Reset tokens expire after 1 hour
4. **Email Enumeration Prevention**: Forgot password endpoint always returns success
5. **Password Validation**: Minimum 6 characters required
6. **Current Password Verification**: Change password requires current password

## Production Considerations

### Email Integration (TODO)
Currently, password reset tokens are logged to the console. For production:

1. Set up an email service (e.g., SendGrid, AWS SES, Resend)
2. Update `/api/auth/forgot-password/route.ts` to send emails
3. Create email templates for password reset
4. Remove console.log statements

Example email integration:
```typescript
// In app/api/auth/forgot-password/route.ts
const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
await sendEmail({
  to: user.email,
  subject: 'Password Reset Request - Brizzle TOEIC',
  html: `
    <p>You requested a password reset.</p>
    <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
    <p>This link expires in 1 hour.</p>
  `
})
```

## Testing

1. **Change Password**:
   - Log in as a student or teacher
   - Click "Change Password" in navbar
   - Enter current password and new password
   - Verify password change works

2. **Forgot Password**:
   - Go to login page
   - Click "Forgot your password?"
   - Enter email address
   - Check console for reset token (development only)

3. **Reset Password**:
   - Copy reset token from console
   - Navigate to `/reset-password?token=<token>`
   - Enter new password
   - Verify you can log in with new password

## Files Created/Modified

### New Files
- `app/api/auth/change-password/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/student/change-password/page.tsx`
- `app/teacher/change-password/page.tsx`
- `app/forgot-password/page.tsx`
- `app/reset-password/page.tsx`
- `scripts/add-password-reset-fields.sql`
- `PASSWORD_MANAGEMENT.md`

### Modified Files
- `prisma/schema.prisma` - Added resetToken and resetTokenExpiry fields
- `components/Navbar.tsx` - Added "Change Password" link
- `app/login/page.tsx` - Added "Forgot your password?" link
