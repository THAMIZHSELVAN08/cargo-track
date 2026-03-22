/**
 * User Model
 * Stores driver, dispatcher, and admin accounts with hashed passwords
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name: { type: string }
 *         email: { type: string }
 *         role: { type: string, enum: [driver, dispatcher, admin] }
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ["driver", "dispatcher", "admin"],
      default: "driver",
    },
    // Biometric profile IDs associated with this user
    biometricFingerprintId: {
      type: String,
      default: null,
    },
    age: {
      type: Number,
      default: null,
    },
    // Vehicle/container assignment for drivers
    assignedContainerId: {
      type: String,
      default: null,
    },
    // Location/Route assigned to the driver
    assignedLocation: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Pre-save hook: hash password before storing ────────────────────────────────
userSchema.pre("save", async function (next) {
  // Only hash if password was modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare plain password with stored hash ──────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: return safe user object (no sensitive fields) ─────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
