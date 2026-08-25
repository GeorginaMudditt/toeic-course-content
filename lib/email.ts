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
    || 'https://www.brizzle-courses.com'

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

const ADMIN_NOTIFY_EMAIL = 'hello@brizzle-english.com'
const FROM_EMAIL = 'Brizzle TOEIC® <noreply@brizzle-english.com>'

function getSiteUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'https://www.brizzle-courses.com'
  )
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendCourseMidpointNotificationEmail(data: {
  studentName: string
  courseName: string
  courseDurationHours: number
  hoursLogged: number
}) {
  const resend = getResendClient()

  if (!resend) {
    console.warn('⚠️  RESEND_API_KEY not found. Course midpoint email not sent.')
    return { error: 'Email service not configured' }
  }

  const threshold = Math.ceil(data.courseDurationHours / 2)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFY_EMAIL,
      subject: `Course midpoint reached — ${data.studentName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hello,</p>
            <p><strong>${escapeHtml(data.studentName)}</strong> has reached the midpoint of their training package.</p>
            <ul>
              <li><strong>Course:</strong> ${escapeHtml(data.courseName)}</li>
              <li><strong>Hours completed:</strong> ${data.hoursLogged} (midpoint at ${threshold} hours)</li>
            </ul>
            <p>You may want to follow up on a second invoice, the midpoint questionnaire, or other admin steps.</p>
            <p style="color:#666;font-size:12px;">This message was sent automatically from the Brizzle teacher portal when lesson notes were saved.</p>
          </body>
        </html>
      `,
    })
    console.log('Course midpoint notification sent to', ADMIN_NOTIFY_EMAIL)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    console.error('Error sending course midpoint email:', error)
    return { error: message }
  }
}

export async function sendWritingSubmissionNotificationEmail(data: {
  studentName: string
  studentEmail: string
  title: string
  submissionId: string
  studentId: string
  hasFile: boolean
}) {
  const resend = getResendClient()

  if (!resend) {
    console.warn('⚠️  RESEND_API_KEY not found. Writing submission email not sent.')
    return { error: 'Email service not configured' }
  }

  const markUrl = `${getSiteUrl()}/teacher/students/${data.studentId}/writing/${data.submissionId}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFY_EMAIL,
      subject: `New writing submission — ${data.studentName}: ${data.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hello,</p>
            <p><strong>${escapeHtml(data.studentName)}</strong> (${escapeHtml(data.studentEmail)}) has submitted a writing assignment.</p>
            <ul>
              <li><strong>Title:</strong> ${escapeHtml(data.title)}</li>
              <li><strong>Attachment:</strong> ${data.hasFile ? 'Yes' : 'No'}</li>
            </ul>
            <p style="margin: 24px 0;">
              <a href="${markUrl}" style="display:inline-block;padding:12px 24px;background:#38438f;color:#ffffff !important;text-decoration:none;border-radius:5px;font-weight:600;">
                Open and mark
              </a>
            </p>
            <p style="word-break:break-all;color:#666;font-size:12px;">${markUrl}</p>
            <p style="color:#666;font-size:12px;">This message was sent automatically from the Brizzle portal when a student submitted writing.</p>
          </body>
        </html>
      `,
    })
    console.log('Writing submission notification sent to', ADMIN_NOTIFY_EMAIL)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    console.error('Error sending writing submission email:', error)
    return { error: message }
  }
}

export async function sendWritingMarkedEmail(data: {
  userEmail: string
  userName: string
  title: string
  submissionId: string
}) {
  const resend = getResendClient()

  if (!resend) {
    console.warn('⚠️  RESEND_API_KEY not found. Writing marked email not sent.')
    return { error: 'Email service not configured' }
  }

  const viewUrl = `${getSiteUrl()}/student/writing/${data.submissionId}`
  const fromEmail = 'Brizzle English School <noreply@brizzle-english.com>'

  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.userEmail,
      subject: `Your writing “${data.title}” has been marked`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hello ${escapeHtml(data.userName)},</p>
            <p>Your writing <strong>“${escapeHtml(data.title)}”</strong> has been marked.</p>
            <p>Please log in to see the corrections.</p>
            <p style="margin: 24px 0;">
              <a href="${viewUrl}" style="display:inline-block;padding:12px 24px;background:#38438f;color:#ffffff !important;text-decoration:none;border-radius:5px;font-weight:600;">
                View marked writing
              </a>
            </p>
            <p style="word-break:break-all;color:#666;font-size:12px;">${viewUrl}</p>
            <p>If you have any questions, please contact us at hello@brizzle-english.com</p>
            <p>Best regards,<br>Georgina</p>
          </body>
        </html>
      `,
    })
    console.log('Writing marked email sent to', data.userEmail)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    console.error('Error sending writing marked email:', error)
    return { error: message }
  }
}
