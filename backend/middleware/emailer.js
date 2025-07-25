import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || "elliott.wisoky@ethereal.email", // Your email address
    pass: process.env.EMAIL_PASS || "1pMKtHYA1E7szcsz22", // Your email password or app-specific password
  },
});

export default transporter;