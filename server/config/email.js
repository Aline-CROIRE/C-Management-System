const nodemailer = require("nodemailer")

// Gmail configuration
const createGmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Gmail credentials not configured. Email functionality will be disabled.")
    return null
  }

  const transporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error("Gmail configuration error:", error)
    } else {
      console.log("Gmail server is ready to send emails")
    }
  })

  return transporter
}

// Email templates
const emailTemplates = {
  verification: (firstName, verificationUrl) => ({
    subject: "Verify Your Email - Comprehensive Management System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1b4332; margin: 0;">Comprehensive Management System</h1>
          <p style="color: #666; margin: 5px 0;">Your Complete Business Solution</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #1b4332; margin-top: 0;">Welcome ${firstName}! 🎉</h2>
          <p style="color: #333; line-height: 1.6;">
            Thank you for joining our comprehensive management platform. You're just one step away from accessing powerful tools for:
          </p>
          
          <ul style="color: #333; line-height: 1.8; padding-left: 20px;">
            <li>📦 Inventory Management System</li>
            <li>🌱 Intelligent Smart Agriculture</li>
            <li>♻️ Waste Management Solutions</li>
            <li>🏗️ Construction Site Management</li>
            <li>📊 Advanced Analytics & Reporting</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationUrl}" 
             style="background: linear-gradient(135deg, #1b4332 0%, #2d5a47 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(27, 67, 50, 0.3);">
            ✅ Verify Email Address
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Important:</strong> This verification link expires in 24 hours for security reasons.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="word-break: break-all; color: #1b4332;">${verificationUrl}</span>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <div style="text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            If you didn't create an account, please ignore this email.<br>
            © 2024 Comprehensive Management System. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  passwordReset: (firstName, resetUrl) => ({
    subject: "🔐 Password Reset - Comprehensive Management System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1b4332; margin: 0;">🔐 Password Reset</h1>
          <p style="color: #666; margin: 5px 0;">Comprehensive Management System</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #1b4332; margin-top: 0;">Hello ${firstName},</h2>
          <p style="color: #333; line-height: 1.6;">
            We received a request to reset your password for your Comprehensive Management System account.
          </p>
          <p style="color: #333; line-height: 1.6;">
            If you made this request, click the button below to set a new password:
          </p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);">
            🔑 Reset Password
          </a>
        </div>
        
        <div style="background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p style="margin: 0; color: #721c24;">
            <strong>⏰ Security Notice:</strong> This reset link expires in 1 hour for your security.
          </p>
        </div>
        
        <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8; margin: 20px 0;">
          <p style="margin: 0; color: #0c5460;">
            <strong>🛡️ Didn't request this?</strong> Your account is safe. Simply ignore this email and your password won't be changed.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="word-break: break-all; color: #dc3545;">${resetUrl}</span>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <div style="text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            For security questions, contact our support team.<br>
            © 2024 Comprehensive Management System. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  welcomeComplete: (firstName, modules) => ({
    subject: "🎉 Welcome to Your Management Dashboard!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1b4332; margin: 0;">🎉 You're All Set!</h1>
          <p style="color: #666; margin: 5px 0;">Welcome to Comprehensive Management System</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #1b4332 0%, #2d5a47 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
          <h2 style="margin: 0 0 10px 0;">Welcome ${firstName}! 🚀</h2>
          <p style="margin: 0; opacity: 0.9;">Your account is now active and ready to use</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #1b4332; margin-top: 0;">📋 Your Assigned Modules:</h3>
          <div style="display: grid; gap: 10px;">
            ${modules
              .map((module) => {
                const moduleIcons = {
                  IMS: "📦",
                  ISA: "🌱",
                  "Waste Management": "♻️",
                  "Construction Sites": "🏗️",
                  Analytics: "📊",
                  "User Management": "👥",
                }
                return `
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #1b4332;">
                  <strong>${moduleIcons[module] || "📋"} ${module}</strong>
                </div>
              `
              })
              .join("")}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard" 
             style="background: linear-gradient(135deg, #1b4332 0%, #2d5a47 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(27, 67, 50, 0.3);">
            🚀 Access Your Dashboard
          </a>
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>💡 Pro Tip:</strong> Explore each module to discover powerful features tailored for your business needs!
          </p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <div style="text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            Need help getting started? Check our documentation or contact support.<br>
            © 2024 Comprehensive Management System. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),
}

// Send email function
const sendEmail = async (to, template, data) => {
  const transporter = createGmailTransporter()

  if (!transporter) {
    console.log("Email not sent - Gmail not configured")
    return false
  }

  try {
    const emailContent = emailTemplates[template](
      data.firstName,
      data.url || data.resetUrl || data.verificationUrl,
      data.modules,
    )

    await transporter.sendMail({
      from: `"Comprehensive Management System" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    console.log(`Email sent successfully to ${to}`)
    return true
  } catch (error) {
    console.error("Email sending error:", error)
    return false
  }
}

module.exports = {
  createGmailTransporter,
  sendEmail,
  emailTemplates,
}
