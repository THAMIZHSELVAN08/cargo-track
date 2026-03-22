/**
 * JWT Authentication Middleware
 * Verifies Bearer tokens and attaches the decoded user to req.user
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");
const { isTokenBlacklisted } = require("../controllers/auth.controller");

/**
 * Middleware: verify JWT token and authenticate the request.
 * Also rejects tokens that have been explicitly blacklisted via logout.
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided. Access denied." });
    }

    const token = authHeader.split(" ")[1];

    // Reject explicitly invalidated tokens (logout blacklist)
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ error: "Token has been revoked. Please log in again." });
    }

    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB (ensures user is still active)
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or deactivated." });
    }

    // Attach user to request object for downstream handlers
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    logger.error("Auth middleware error:", err);
    res.status(500).json({ error: "Authentication failed." });
  }
};

/**
 * Middleware factory: restrict access to specific roles
 * Usage: authorize("admin", "dispatcher")
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
