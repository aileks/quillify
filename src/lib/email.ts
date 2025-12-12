import { MailtrapClient } from 'mailtrap';

const mailtrap = new MailtrapClient({
  token: process.env.MAILTRAP_API_KEY!,
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  category?: string;
}

export async function sendEmail({ to, subject, html, text, category }: SendEmailOptions) {
  const fromAddress = process.env.MAIL_FROM_ADDRESS || 'noreply@quillify-app.com';
  const fromName = process.env.MAIL_FROM_NAME || 'Quillify';

  const response = await mailtrap.send({
    from: { name: fromName, email: fromAddress },
    to: [{ email: to }],
    subject,
    html,
    text,
    category,
  });

  return response;
}
