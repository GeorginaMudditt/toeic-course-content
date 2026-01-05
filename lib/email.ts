import { Resend } from 'resend'

// Initialize Resend lazily to avoid build-time errors when API key is not set
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

interface PasswordResetEmail {
  userEmail: string
  userName: string
  resetToken: string
}

/**
 * Sends a password reset email to the user via Resend
 */
export async function sendPasswordResetEmail(data: PasswordResetEmail) {
  const resend = getResendClient()
  
  if (!resend) {
    console.warn('⚠️  RESEND_API_KEY not found. Email not sent.')
    return { error: 'Email service not configured' }
  }

  // Get site URL for absolute links in emails
  const siteUrl = process.env.NEXTAUTH_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'https://toeic-course-content.netlify.app'

  const resetUrl = `${siteUrl}/reset-password?token=${data.resetToken}`

  // Use noreply@brizzle-english.com (domain is verified in Resend)
  const fromEmail = 'Brizzle TOEIC® <noreply@brizzle-english.com>'
  
  console.log('📤 Attempting to send password reset email:', {
    from: fromEmail,
    to: data.userEmail,
    siteUrl,
    resetUrl,
    hasApiKey: !!process.env.RESEND_API_KEY
  })
  
  try {
    const result = await resend.emails.send({
      from: fromEmail,
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
              .button { display: inline-block; padding: 12px 24px; background: #38438f; color: #ffffff !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
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
                  <a href="${resetUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">Reset Your Password</a>
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

    console.log('Password reset email sent successfully to:', data.userEmail)
    console.log('Resend response:', JSON.stringify(result, null, 2))
    return { success: true }
  } catch (error: any) {
    console.error('Error sending password reset email:', error)
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      response: error?.response
    })
    return { error: error?.message || 'Failed to send email', details: error }
  }
}
