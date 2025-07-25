import nodemailer from 'nodemailer';

import transporter from '../middleware/emailer.js';

async function testEmail() {
  try {
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER || "elliott.wisoky@ethereal.email", // Sender address
      to: 'recipient@example.com', // Replace with a valid recipient email
      subject: 'Test Email',
      text: 'This is a test email sent using Ethereal.',
    });

    console.log('✅ Test email sent successfully!');
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info)); // Preview email in Ethereal
  } catch (err) {
    console.error('❌ Error sending test email:', err);
  }
}

testEmail();