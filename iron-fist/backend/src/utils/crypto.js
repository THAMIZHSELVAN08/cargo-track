/**
 * Crypto Utility
 * Hash generation for blockchain logging
 */

const crypto = require("crypto");

/**
 * Generate a SHA-256 hash of any data object
 * Used to store tamper-proof hashes on the Ethereum blockchain
 * @param {object|string} data - Data to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
const generateHash = (data) => {
  const stringified = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(stringified).digest("hex");
};

/**
 * Generate a hash with timestamp to ensure uniqueness
 * @param {object} data
 * @returns {{ hash: string, timestamp: string }}
 */
const generateTimestampedHash = (data) => {
  const timestamp = new Date().toISOString();
  const payload = { ...data, _ts: timestamp };
  return {
    hash: generateHash(payload),
    timestamp,
  };
};

module.exports = { generateHash, generateTimestampedHash };
