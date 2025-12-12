interface EmailVerificationParams {
  verificationUrl: string;
  userName?: string | null;
  expiresInHours: number;
  isExistingUser?: boolean;
}

export function getEmailVerificationHtml({
  verificationUrl,
  userName,
  expiresInHours,
  isExistingUser = false,
}: EmailVerificationParams): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';
  const message =
    isExistingUser ?
      `We've updated our email verification system. Please verify your email address to continue using your account.`
    : `Thank you for creating an account. Please verify your email address to get started.`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="https://quillify-app.com/quill-logo.png" alt="Quillify" width="48" height="48" style="display: block;">
              <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 600; color: #18181b;">Quillify</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
                ${message}
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 8px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #71717a;">
                This link will expire in <strong>${expiresInHours} hours</strong>.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #71717a;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 20px; color: #a1a1aa; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
              
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #a1a1aa;">
                If you didn't ${isExistingUser ? 'have an account with us' : 'create an account'}, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                &copy; ${new Date().getFullYear()} Quillify. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getEmailVerificationText({
  verificationUrl,
  userName,
  expiresInHours,
  isExistingUser = false,
}: EmailVerificationParams): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';
  const message =
    isExistingUser ?
      `We've updated our email verification system. Please verify your email address to continue using your account.`
    : `Thank you for creating an account. Please verify your email address to get started.`;

  return `
${greeting}

${message}

Click the link below to verify your email:
${verificationUrl}

This link will expire in ${expiresInHours} hours.

If you didn't ${isExistingUser ? 'have an account with us' : 'create an account'}, you can safely ignore this email.

---
Quillify
`.trim();
}
