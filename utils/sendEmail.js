// utils/sendEmail.js
// -----------------------------------------------------------------------
// Minimal email helper. If SMTP credentials are configured in .env it
// will send real email via nodemailer-compatible transport; otherwise it
// safely logs the email to the console so local development / demos
// still "work" without requiring a mail provider.
// -----------------------------------------------------------------------
async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.log('\n📧  [DEV EMAIL - no SMTP configured] ------------------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(html.replace(/<[^>]+>/g, ' ').trim());
    console.log('----------------------------------------------------------\n');
    return { simulated: true };
  }

  // Lazily require nodemailer only if actually configured & installed.
  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  return transporter.sendMail({
    from: process.env.FROM_EMAIL || 'no-reply@sisfora.com',
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
