import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, reason } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!reason || typeof reason !== 'string') {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    // Configure nodemailer transport
    // Using environment variables for SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC'

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@parkmanagementconsultants.com',
      to: 'support@parkmanagementconsultants.com',
      subject: 'New Contact Us Submission',
      text: `A new Contact Us request has been submitted.

Name:
${name}

Email:
${email}

Reason:
${reason}

Submitted At:
${timestamp}
`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background-color: #111111; padding: 24px; text-align: center; border-bottom: 4px solid #FFE500; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 32px; color: #374151; }
            .greeting { font-size: 16px; margin-bottom: 24px; line-height: 1.5; }
            .detail-block { margin-bottom: 20px; background-color: #f3f4f6; padding: 16px; border-radius: 6px; border-left: 4px solid #FFE500; }
            .detail-label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 700; margin-bottom: 4px; }
            .detail-value { font-size: 16px; font-weight: 500; color: #111827; word-break: break-word; }
            .message-block { margin-bottom: 24px; }
            .message-label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 700; margin-bottom: 8px; }
            .message-content { background-color: #ffffff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 6px; font-size: 15px; line-height: 1.6; white-space: pre-wrap; color: #111827; }
            .footer { padding: 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Submission</h1>
            </div>
            <div class="content">
              <div class="greeting">
                A new inquiry has been submitted via the website's Contact Us form.
              </div>
              
              <div class="detail-block">
                <div class="detail-label">Name</div>
                <div class="detail-value">${name}</div>
              </div>
              
              <div class="detail-block">
                <div class="detail-label">Email Address</div>
                <div class="detail-value"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></div>
              </div>
              
              <div class="message-block">
                <div class="message-label">Message / Reason</div>
                <div class="message-content">${reason}</div>
              </div>
            </div>
            
            <div class="footer">
              Submitted at: ${timestamp}
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Only attempt to send if SMTP_USER is configured, otherwise just simulate success
    // This allows the app to run without crashing if the user hasn't set up the email yet.
    if (process.env.SMTP_USER) {
      await transporter.sendMail(mailOptions)
    } else {
      console.log('Mocking email sending (SMTP_USER not configured):', mailOptions)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
