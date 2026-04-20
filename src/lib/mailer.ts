
import nodemailer from 'nodemailer';

export async function sendMail(to: string, subject: string, html: string) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('[Mailer] EMAIL_USER or EMAIL_PASS not set. Skipping mail dispatch.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', // or your provider
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: `"기틀 미디어" <${user}>`,
      to,
      subject,
      html,
    });
    console.log('[Mailer] Email sent: ', info.messageId);
    return info;
  } catch (error) {
    console.error('[Mailer] Error sending email:', error);
    throw error;
  }
}
