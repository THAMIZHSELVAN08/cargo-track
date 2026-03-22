/**
 * Winston Logger Utility
 * Provides structured logging with file and console transports
 */

const { createLogger, format, transports } = require("winston");
const path = require("path");

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Console transport with colorized output for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
          return `[${timestamp}] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
    // File transports for persisting logs
    new transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
    }),
    new transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
    }),
  ],
});

module.exports = logger;
