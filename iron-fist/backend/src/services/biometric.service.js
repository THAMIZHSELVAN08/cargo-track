/**
 * Biometric Service (Simulated)
 * Simulates fingerprint and face verification since real hardware is unavailable.
 *
 * In production, this service would:
 * - Call a hardware SDK / biometric reader API
 * - Use a FaceID/liveness-detection API (e.g. AWS Rekognition, Azure Face API)
 */

const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

// In-memory biometric session store (use Redis in production)
const activeSessions = new Map();

/**
 * Simulate fingerprint verification
 * Validates a provided fingerprintId against the user's enrolled biometric ID
 * @param {string} providedId - Fingerprint ID submitted by the driver
 * @param {string} enrolledId - Fingerprint ID stored in User document
 * @returns {{ verified: boolean, sessionId: string|null }}
 */
const verifyFingerprint = (providedId, enrolledId) => {
  // Simulated match logic: IDs must match exactly
  const verified = providedId && enrolledId && providedId === enrolledId;

  if (verified) {
    const sessionId = uuidv4();
    // Session expires in 5 minutes
    activeSessions.set(sessionId, { type: "fingerprint", createdAt: Date.now(), ttl: 5 * 60 * 1000 });
    logger.info(`Biometric fingerprint verified. Session: ${sessionId}`);
    return { verified: true, sessionId };
  }

  logger.warn(`Biometric fingerprint mismatch. Provided: ${providedId}`);
  return { verified: false, sessionId: null };
};

/**
 * Simulate face verification
 * In simulation mode, any uploaded image with a filename containing "face" passes
 * In production: call a real Face Recognition API here
 * @param {object} file - Multer file object (image upload)
 * @param {string} userId - User ID for audit trail
 * @returns {{ verified: boolean, sessionId: string|null, confidence: number }}
 */
const verifyFace = (file, userId) => {
  if (!file) {
    return { verified: false, sessionId: null, confidence: 0 };
  }

  // Simulation: always verify if image was successfully uploaded
  // Replace this with real API call in production
  const confidence = 0.92 + Math.random() * 0.07; // Mock 92-99% confidence
  const sessionId = uuidv4();

  activeSessions.set(sessionId, {
    type: "face",
    userId,
    confidence,
    createdAt: Date.now(),
    ttl: 5 * 60 * 1000,
  });

  logger.info(`Face verification simulated. Confidence: ${(confidence * 100).toFixed(1)}%. Session: ${sessionId}`);
  return { verified: true, sessionId, confidence };
};

/**
 * Validate a biometric session token
 * Used during the unlock flow to confirm biometrics were recently verified
 * @param {string} sessionId
 * @returns {boolean}
 */
const validateSession = (sessionId) => {
  if (!sessionId || !activeSessions.has(sessionId)) return false;

  const session = activeSessions.get(sessionId);
  const isExpired = Date.now() - session.createdAt > session.ttl;

  if (isExpired) {
    activeSessions.delete(sessionId);
    return false;
  }

  return true;
};

/**
 * Clean up expired biometric sessions (run periodically)
 */
const cleanupSessions = () => {
  const now = Date.now();
  for (const [key, session] of activeSessions.entries()) {
    if (now - session.createdAt > session.ttl) {
      activeSessions.delete(key);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupSessions, 10 * 60 * 1000);

module.exports = { verifyFingerprint, verifyFace, validateSession };
