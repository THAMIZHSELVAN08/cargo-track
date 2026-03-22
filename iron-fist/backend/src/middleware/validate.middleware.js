/**
 * Request Validation Middleware
 * Uses express-validator to validate and sanitize incoming request data
 */

const { validationResult } = require("express-validator");

/**
 * Middleware: collect validation errors and return 422 if any exist
 * Always use this AFTER your validation chain middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validate };
