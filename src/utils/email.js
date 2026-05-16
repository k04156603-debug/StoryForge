const nodemailer = require('nodemailer');

/**
 * Send email utility
 * @param {Object} options - Email options (email, subject, message, html)
 */
const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  // Define mail options
  const mailOptions = {
    from: `Story Forge <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send email
  console.log(`[DEBUG] Sending email FROM: ${mailOptions.from} TO: ${mailOptions.to}`);
  await transporter.sendMail(mailOptions);
  console.log(`[DEBUG] Email sent successfully to ${options.email}`);
};

module.exports = sendEmail;
