const { sendEmail } = require("../config/email")

class EmailService {
  static async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`

    return await sendEmail(user.email, "verification", {
      firstName: user.firstName,
      verificationUrl: verificationUrl,
    })
  }

  static async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

    return await sendEmail(user.email, "passwordReset", {
      firstName: user.firstName,
      resetUrl: resetUrl,
    })
  }

  static async sendWelcomeEmail(user) {
    return await sendEmail(user.email, "welcomeComplete", {
      firstName: user.firstName,
      modules: user.modules,
    })
  }

  static async sendModuleAccessEmail(user, newModules) {
    const moduleList = newModules.join(", ")

    return await sendEmail(user.email, "moduleAccess", {
      firstName: user.firstName,
      modules: newModules,
      moduleList: moduleList,
    })
  }

  static async sendAccountStatusEmail(user, status) {
    const statusMessages = {
      activated: "Your account has been activated and you now have full access to the system.",
      deactivated: "Your account has been temporarily deactivated. Please contact your administrator.",
      locked: "Your account has been locked due to security reasons. Please contact support.",
      unlocked: "Your account has been unlocked and you can now log in normally.",
    }

    return await sendEmail(user.email, "accountStatus", {
      firstName: user.firstName,
      status: status,
      message: statusMessages[status],
    })
  }
}

module.exports = EmailService
