interface PasswordResetEmailParams {
  resetUrl: string;
  userName?: string | null;
  expiresInMinutes: number;
}

// Quillify brand colors (converted from oklch to hex)
const colors = {
  // Warm cream background
  background: '#f5f0e6',
  // Card/content background
  card: '#faf8f4',
  // Primary amber/orange
  primary: '#b45309',
  primaryHover: '#d97706',
  // Dark brown for sidebar/headers
  dark: '#4a3f35',
  // Text colors
  text: '#3d3429',
  textMuted: '#6b5d4d',
  textLight: '#8b7d6b',
  // Borders
  border: '#d4cbbe',
  borderLight: '#e8e2d6',
};

export function getPasswordResetEmailHtml({
  resetUrl,
  userName,
  expiresInMinutes,
}: PasswordResetEmailParams): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: ${colors.background};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
          
          <!-- Header with dark background -->
          <tr>
            <td align="center" style="background-color: ${colors.dark}; padding: 32px 40px; border-radius: 12px 12px 0 0;">
              <img src="https://quillify-app.com/quill-logo.png" alt="Quillify" width="44" height="44" style="display: block;">
              <h1 style="margin: 12px 0 0 0; font-size: 26px; font-weight: 400; color: #faf8f4; font-family: 'Georgia', 'Times New Roman', serif; letter-spacing: 0.5px;">Quillify</h1>
            </td>
          </tr>
          
          <!-- Main content card -->
          <tr>
            <td style="background-color: ${colors.card}; padding: 40px; border-left: 1px solid ${colors.borderLight}; border-right: 1px solid ${colors.borderLight};">
              <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 28px; color: ${colors.text}; font-family: 'Georgia', 'Times New Roman', serif;">
                ${greeting}
              </p>
              <p style="margin: 0 0 28px 0; font-size: 16px; line-height: 26px; color: ${colors.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                We received a request to reset your password. Click the button below to choose a new password.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px 0;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; background-color: ${colors.primary}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: 0.3px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Decorative divider -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 0 0 24px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="border-top: 1px solid ${colors.border}; height: 1px; font-size: 0; line-height: 0;">&nbsp;</td>
                        <td style="width: 60px; text-align: center; padding: 0 12px;">
                          <span style="font-size: 18px; color: ${colors.primary};">&#9830;</span>
                        </td>
                        <td style="border-top: 1px solid ${colors.border}; height: 1px; font-size: 0; line-height: 0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: ${colors.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                This link will expire in <strong style="color: ${colors.text};">${expiresInMinutes} minutes</strong>.
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 21px; color: ${colors.textLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 20px; color: ${colors.primary}; word-break: break-all; font-family: 'Courier New', monospace; background-color: ${colors.background}; padding: 12px; border-radius: 6px; border: 1px solid ${colors.borderLight};">
                ${resetUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${colors.card}; padding: 24px 40px; border: 1px solid ${colors.borderLight}; border-top: none; border-radius: 0 0 12px 12px;">
              <!-- Border separator -->
              <div style="border-top: 1px solid ${colors.border}; margin-bottom: 20px;"></div>
              <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 20px; color: ${colors.textLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <p style="margin: 0; font-size: 12px; color: ${colors.textLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
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

export function getPasswordResetEmailText({
  resetUrl,
  userName,
  expiresInMinutes,
}: PasswordResetEmailParams): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';

  return `
${greeting}

We received a request to reset your password.

Click the link below to choose a new password:
${resetUrl}

This link will expire in ${expiresInMinutes} minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
Quillify
`.trim();
}
