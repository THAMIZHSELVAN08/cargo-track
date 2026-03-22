/**
 * Auth Controller
 * Handles registration, login, logout, and token refresh
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { createEventLog } = require("../services/eventLogger.service");
const logger = require("../utils/logger");

/**
 * In-memory token blacklist for logout invalidation.
 * In production replace with Redis (TTL-keyed by token jti / exp).
 */
const tokenBlacklist = new Set();

/**
 * Generate a signed JWT for a user.
 * Short expiry (1d) limits the attack window for stolen tokens.
 * @param {object} user
 * @returns {string} JWT token
 */
const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d", // 1 day — safer than 7d
  });
};

module.exports.isTokenBlacklisted = (token) => tokenBlacklist.has(token);

/**
 * POST /auth/register
 * Create a new user account (Admin only in production; open for dev)
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, age, biometricFingerprintId, assignedContainerId } = req.body;

    // Check for duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const user = await User.create({
      name,
      email,
      password,
      age: age || null,
      role: role || "driver",
      biometricFingerprintId: biometricFingerprintId || null,
      assignedContainerId: assignedContainerId || null,
    });

    const token = signToken(user);

    await createEventLog({
      eventType: "LOGIN_SUCCESS",
      user,
      details: { action: "register" },
      outcome: "SUCCESS",
      ipAddress: req.ip,
    });

    logger.info(`New user registered: ${email} (${role})`);
    res.status(201).json({
      message: "Registration successful",
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    res.status(500).json({ error: "Registration failed." });
  }
};

/**
 * POST /auth/login
 * Authenticate with email + password, return JWT
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Explicitly select password since it's excluded by default
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.isActive) {
      await createEventLog({
        eventType: "LOGIN_FAILURE",
        details: { email, reason: "User not found or inactive" },
        outcome: "FAILURE",
        ipAddress: req.ip,
      });
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      await createEventLog({
        eventType: "LOGIN_FAILURE",
        user,
        details: { reason: "Wrong password" },
        outcome: "FAILURE",
        ipAddress: req.ip,
      });
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);

    await createEventLog({
      eventType: "LOGIN_SUCCESS",
      user,
      details: { role: user.role },
      outcome: "SUCCESS",
      ipAddress: req.ip,
    });

    logger.info(`User logged in: ${email}`);
    res.json({
      message: "Login successful",
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ error: "Login failed." });
  }
};

/**
 * POST /auth/logout
 * Blacklists the current token so it cannot be reused for its remaining TTL.
 */
exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      tokenBlacklist.add(token);
      logger.info(`Token blacklisted for user ${req.user?._id}`);
    }
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    logger.error(`Logout error: ${err.message}`);
    res.status(500).json({ error: "Logout failed." });
  }
};

/**
 * GET /auth/me
 * Return the authenticated user's profile
 */
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * PUT /auth/update-profile
 * Update name, biometricFingerprintId, assignedContainerId
 */
exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    const allowed = ["name", "biometricFingerprintId", "assignedContainerId"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ error: "Profile update failed." });
  }
};

/**
 * GET /auth/users (Admin only)
 * List all users
 */
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
};

/**
 * PUT /auth/users/:id (Admin only)
 * Update any user's profile context (e.g. assignedLocation)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = ["name", "biometricFingerprintId", "assignedContainerId", "assignedLocation", "role", "age", "isActive"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) return res.status(404).json({ error: "User not found." });

    res.json({ message: "User updated", user: user.toSafeObject() });
  } catch (err) {
    logger.error(`Update user error: ${err.message}`);
    res.status(500).json({ error: "Failed to update user." });
  }
};

/**
 * PUT /auth/users/update-by-container/:containerId (Admin only)
 */
exports.updateByContainer = async (req, res) => {
  try {
    const { containerId } = req.params;
    const { assignedLocation } = req.body;

    const user = await User.findOneAndUpdate(
      { assignedContainerId: containerId },
      { assignedLocation },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "No driver found assigned to this container." });
    }

    res.json({ message: "Route assigned successfully", user: user.toSafeObject() });
  } catch (err) {
    logger.error(`Update by container error: ${err.message}`);
    res.status(500).json({ error: "Failed to update driver assignment." });
  }
};
