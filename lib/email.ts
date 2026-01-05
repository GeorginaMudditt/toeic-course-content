import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface PasswordResetEmail {
  userEmail: string
  userName: string
  resetToken: string
}

/**
 * Sends a password reset email to the user
 */
export async function sendPasswordResetEmail(data: PasswordResetEmail) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not found. Email not sent.')
    return { error: 'Email service not configured' }
  }

  // Get site URL for absolute links in emails
  const siteUrl = process.env.NEXTAUTH_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'https://toeic-course-content.netlify.app'

  const resetUrl = `${siteUrl}/reset-password?token=${data.resetToken}`

  try {
    await resend.emails.send({
      from: 'Brizzle TOEIC® <noreply@brizzle-english.com>',
      to: data.userEmail,
      subject: 'Password Reset Request - Brizzle TOEIC®',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(to bottom right, #38438f, #2d3570); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #38438f; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello ${data.userName},</p>
                <p>You requested to reset your password for your Brizzle TOEIC® account.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" class="button">Reset Your Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
                
                <div class="warning">
                  <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
                  <ul style="margin: 10px 0 0 20px; padding: 0;">
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                    <li>Your password will not change until you click the link above</li>
                  </ul>
                </div>
                
                <p>If you have any questions, please contact us at hello@brizzle-english.com</p>
                <p>Best regards,<br>The Brizzle TOEIC® Team</p>
              </div>
              <div class="footer">
                <p>Brizzle TOEIC®<br>hello@brizzle-english.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { error: 'Failed to send email' }
  }
}
