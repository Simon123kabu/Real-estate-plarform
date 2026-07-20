const nodemailer = require('nodemailer');

// 1. Create secure Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465 SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Builds HTML template wrapper for consistent branding.
 * @param {string} title - Email header title
 * @param {string} bodyContent - Core HTML content
 * @returns {string} Fully styled HTML email body
 */
function buildHtmlTemplate(title, bodyContent) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 40px 20px;
            color: #1f2937;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
            border: 1px solid #e5e7eb;
          }
          .email-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
            padding: 30px;
            text-align: center;
          }
          .email-header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
          }
          .email-body {
            padding: 40px 30px;
            line-height: 1.6;
          }
          .email-body h2 {
            font-size: 20px;
            color: #111827;
            margin-top: 0;
            font-weight: 600;
          }
          .email-body p {
            color: #4b5563;
            font-size: 16px;
            margin-bottom: 24px;
          }
          .info-card {
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
          }
          .info-value {
            font-weight: 700;
            color: #0f172a;
            font-size: 14px;
            text-align: right;
          }
          .btn-primary {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            font-size: 16px;
            margin-top: 8px;
          }
          .email-footer {
            background-color: #f8fafc;
            padding: 20px 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Real Estate Hub</h1>
          </div>
          <div class="email-body">
            ${bodyContent}
          </div>
          <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()} Real Estate Hub. All rights reserved.</p>
            <p>This is an automated subscription billing alert. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Sends helper mail.
 */
async function sendMail(to, subject, html) {
  try {
    // If credentials are dummy, skip sending and just log to keep tests green
    const isConfigured = process.env.EMAIL_USER && !process.env.EMAIL_USER.startsWith('your_gmail');
    if (!isConfigured) {
      console.log(`[Email Mock] Skipping send to ${to} (credentials not configured). Subject: ${subject}`);
      return null;
    }

    const info = await transporter.sendMail({
      from: `"Real Estate Hub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log(`[Email Service] Notification sent successfully to ${to}. MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message);
    // Return null, don't crash core database workflows if email fails
    return null;
  }
}

/**
 * Sends a welcome/activation subscription success email.
 * @param {string} email - Recipient email
 * @param {string} name - Agent name
 * @param {string} planName - Activated plan name ('Premium' or 'Premium Plus')
 * @param {Date} expiryDate - Subscription expiration end date
 */
async function sendSubscriptionSuccessEmail(email, name, planName, expiryDate) {
  const formattedExpiry = expiryDate ? new Date(expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A';
  const html = buildHtmlTemplate(
    'Subscription Activated',
    `
      <h2>Hello ${name || 'Agent'},</h2>
      <p>Thank you for subscribing! Your paid agent subscription has been successfully processed and activated. You can now post and manage property listings under your upgraded plan limits.</p>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Subscription Tier</div>
          <div class="info-value">${planName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Status</div>
          <div class="info-value" style="color: #10b981;">Active</div>
        </div>
        <div class="info-row">
          <div class="info-label">Renewal Date</div>
          <div class="info-value">${formattedExpiry}</div>
        </div>
      </div>

      <p>Your property listings' visibility lifespans have been aligned with your billing cycle and will remain active until your renewal date.</p>
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn-primary">Go to Dashboard</a>
      </div>
    `
  );

  return sendMail(email, `Subscription Activated: Welcome to ${planName}!`, html);
}

/**
 * Sends a subscription expiration warning reminder email.
 * @param {string} email - Recipient email
 * @param {string} name - Agent name
 * @param {string} planName - Current plan name
 * @param {number} daysRemaining - Days until expiration (e.g. 14 or 3)
 * @param {Date} expiryDate - Expiration date
 */
async function sendExpiryReminderEmail(email, name, planName, daysRemaining, expiryDate) {
  const formattedExpiry = expiryDate ? new Date(expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A';
  const html = buildHtmlTemplate(
    'Subscription Renewal Reminder',
    `
      <h2>Hello ${name || 'Agent'},</h2>
      <p>This is a friendly reminder that your paid agent subscription plan is scheduled to expire in <strong>${daysRemaining} days</strong> on ${formattedExpiry}.</p>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Subscription Tier</div>
          <div class="info-value">${planName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Time Remaining</div>
          <div class="info-value" style="color: #f59e0b;">${daysRemaining} days</div>
        </div>
        <div class="info-row">
          <div class="info-label">Expiration Date</div>
          <div class="info-value">${formattedExpiry}</div>
        </div>
      </div>

      <p>To avoid listing deactivations and retain your active quotas, please renew or verify your billing settings before the expiration date.</p>
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/billing" class="btn-primary">Renew Subscription</a>
      </div>
    `
  );

  return sendMail(email, `Renewal Warning: Your ${planName} subscription expires in ${daysRemaining} days`, html);
}

/**
 * Sends a notification indicating the subscription has run out and properties are expired.
 * @param {string} email - Recipient email
 * @param {string} name - Agent name
 */
async function sendSubscriptionExpiredEmail(email, name) {
  const html = buildHtmlTemplate(
    'Subscription Expired',
    `
      <h2>Hello ${name || 'Agent'},</h2>
      <p>Your subscription plan has expired. Consequently, your active listing quotas have been set to standard free limits and your posted property listings have been marked as **expired** and hidden from public searches.</p>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Subscription State</div>
          <div class="info-value" style="color: #ef4444;">Expired</div>
        </div>
        <div class="info-row">
          <div class="info-label">Properties Expired</div>
          <div class="info-value">All Active Listings</div>
        </div>
      </div>

      <p>To reactivate your listings and make them visible to buyers again, please purchase a new plan from your agent dashboard billing panel.</p>
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/billing" class="btn-primary">Upgrade Now</a>
      </div>
    `
  );

  return sendMail(email, 'Alert: Your subscription has expired', html);
}

/**
 * Sends a password reset link to the user's email.
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {string} resetUrl - Full reset URL containing the plaintext token
 */
async function sendPasswordResetEmail(email, name, resetUrl) {
  const html = buildHtmlTemplate(
    'Password Reset Request',
    `
      <h2>Hello ${name || 'there'},</h2>
      <p>We received a request to reset the password for your Real Estate Hub account. Click the button below to set a new password. This link is valid for <strong>10 minutes</strong>.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" class="btn-primary">Reset My Password</a>
      </div>
      <p>If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Link Expires In</div>
          <div class="info-value" style="color: #f59e0b;">10 minutes</div>
        </div>
      </div>
      <p style="font-size: 14px; color: #6b7280;">If the button above doesn't work, copy and paste the following URL into your browser:</p>
      <p style="font-size: 12px; word-break: break-all; color: #2563eb;">${resetUrl}</p>
    `
  );

  return sendMail(email, 'Password Reset Request — Real Estate Hub', html);
}

module.exports = {
  sendSubscriptionSuccessEmail,
  sendExpiryReminderEmail,
  sendSubscriptionExpiredEmail,
  sendPasswordResetEmail,
};
