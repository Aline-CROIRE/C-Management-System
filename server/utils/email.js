const nodemailer = require("nodemailer");

// ✅ Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your regular Gmail password)
  },
});

// 📩 Email templates
const templates = {
  emailVerification: (data) => `
    <!DOCTYPE html>
    <html>
    <head><style>/* styles omitted for brevity */</style></head>
    <body>
      <div class="container">
        <div class="header"><h1>🚀 Management System Pro</h1><p>Welcome! Please verify your email to continue</p></div>
        <div class="content">
          <h2>Hello ${data.firstName}!</h2>
          <p>Thank you for registering with Management System Pro. To complete your registration, verify your email:</p>
          <div style="text-align: center;"><a href="${data.verificationUrl}" class="button">Verify Email Address</a></div>
          <p>If the button doesn't work, copy this link:</p>
          <p style="color: #2d7d2d;">${data.verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p><em>Note: An admin must assign modules before you can start using the system.</em></p>
        </div>
        <div class="footer"><p>© 2024 Management System Pro. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `,

  passwordSetup: (data) => `
    <!DOCTYPE html>
    <html>
    <head><style>/* styles omitted for brevity */</style></head>
    <body>
      <div class="container">
        <div class="header"><h1>🚀 Management System Pro</h1><p>Your account has been created!</p></div>
        <div class="content">
          <h2>Welcome ${data.firstName}!</h2>
          <p>Your admin created an account for you. Set your password below:</p>
          ${data.modules?.length ? `<div class="modules"><h3>📋 Modules:</h3><ul>${data.modules.map((m) => `<li>• ${m}</li>`).join("")}</ul></div>` : ""}
          <div style="text-align: center;"><a href="${data.setupUrl}" class="button">Set Up Password</a></div>
          <p>If the button doesn't work, copy this link:</p>
          <p style="color: #2d7d2d;">${data.setupUrl}</p>
        </div>
        <div class="footer"><p>© 2024 Management System Pro. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `,

  passwordReset: (data) => `
    <!DOCTYPE html>
    <html>
    <head><style>/* styles omitted for brevity */</style></head>
    <body>
      <div class="container">
        <div class="header"><h1>🚀 Management System Pro</h1><p>Password Reset</p></div>
        <div class="content">
          <h2>Hello ${data.firstName || "User"}!</h2>
          <p>You requested a password reset. Click below:</p>
          <div style="text-align: center;"><a href="${data.resetUrl}" class="button">Reset Password</a></div>
          <p>If the button doesn't work, copy this link:</p>
          <p style="color: #2d7d2d;">${data.resetUrl}</p>
          <p><strong>Expires in 1 hour.</strong></p>
        </div>
        <div class="footer"><p>© 2024 Management System Pro. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `,
};

// 📧 Send email function
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    if (!templates[template]) {
      throw new Error(`Email template '${template}' not found`);
    }

    const html = templates[template](data);

    const mailOptions = {
      from: `"Management System Pro" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
    throw error;
  }
};

module.exports = { sendEmail };
