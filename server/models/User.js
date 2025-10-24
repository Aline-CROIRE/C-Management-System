// server/models/User.js
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "manager", "user", "viewer"],
    default: "user",
  },
  modules: [
    {
      type: String,
      enum: ["IMS", "ISA", "Waste Management", "Construction Sites", "Analytics", "User Management", "Restaurant"],
    },
  ],
  permissions: {
    inventory: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    agriculture: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    waste: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    construction: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    analytics: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
    },
    users: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    restaurant: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
  // NEW: Link user to a restaurant they own/manage
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null, // Default to null, set after restaurant creation
    index: true,
  },
  profile: {
    phone: String,
    address: String,
    department: String,
    position: String,
    avatar: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true })

userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

userSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    })
  }

  const updates = { $inc: { loginAttempts: 1 } }

  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }
  }

  return this.updateOne(updates)
}

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  })
}

userSchema.methods.hasPermission = function (module, action) {
  if (this.role === "admin") return true
  return this.permissions[module] && this.permissions[module][action]
}

userSchema.methods.hasModuleAccess = function (moduleName) {
  if (this.role === "admin") return true
  return this.modules.includes(moduleName)
}

module.exports = mongoose.model("User", userSchema)