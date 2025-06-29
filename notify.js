require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendNotification(subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Visa Bot" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject,
    text
  });
}

module.exports = { sendNotification };
