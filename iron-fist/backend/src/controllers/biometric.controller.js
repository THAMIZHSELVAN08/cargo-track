/**
 * Biometric Controller
 * Handles fingerprint and face verification endpoints
 */

const multer = require("multer");
const path = require("path");
const { verifyFingerprint, verifyFace } = require("../services/biometric.service");
const { createEventLog } = require("../services/eventLogger.service");
const logger = require("../utils/logger");

// Configure multer for face image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/biometric"));
  },
  filename: (req, file, cb) => {
    cb(null, `face_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880") },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG/PNG/WebP images are allowed."));
  },
});

// Export multer middleware for use in routes
exports.uploadMiddleware = upload.single("faceImage");

/**
 * POST /biometric/fingerprint
 * Verify a fingerprint ID against the user's enrolled biometric
 * Body: { fingerprintId }
 */
exports.verifyFingerprintEndpoint = async (req, res) => {
  try {
    const { fingerprintId } = req.body;
    const user = req.user;

    if (!user.biometricFingerprintId) {
      return res.status(400).json({
        error: "No fingerprint enrolled. Please update your profile with a biometricFingerprintId.",
      });
    }

    const result = verifyFingerprint(fingerprintId, user.biometricFingerprintId);

    await createEventLog({
      eventType: result.verified ? "BIOMETRIC_VERIFIED" : "BIOMETRIC_FAILED",
      user,
      details: { method: "fingerprint", verified: result.verified },
      outcome: result.verified ? "SUCCESS" : "FAILURE",
      ipAddress: req.ip,
    });

    if (!result.verified) {
      return res.status(401).json({ error: "Fingerprint verification failed.", verified: false });
    }

    res.json({
      message: "Fingerprint verified successfully.",
      verified: true,
      sessionId: result.sessionId,
      expiresIn: "5 minutes",
    });
  } catch (err) {
    logger.error(`Fingerprint verify error: ${err.message}`);
    res.status(500).json({ error: "Fingerprint verification failed." });
  }
};

/**
 * POST /biometric/face
 * Upload a face image for verification
 * Form data: faceImage (file)
 */
exports.verifyFaceEndpoint = async (req, res) => {
  try {
    const result = verifyFace(req.file, req.user._id.toString());

    await createEventLog({
      eventType: result.verified ? "BIOMETRIC_VERIFIED" : "BIOMETRIC_FAILED",
      user: req.user,
      details: { method: "face", verified: result.verified, confidence: result.confidence },
      outcome: result.verified ? "SUCCESS" : "FAILURE",
      ipAddress: req.ip,
    });

    if (!result.verified) {
      return res.status(401).json({ error: "Face verification failed.", verified: false });
    }

    res.json({
      message: "Face verified successfully.",
      verified: true,
      confidence: `${(result.confidence * 100).toFixed(1)}%`,
      sessionId: result.sessionId,
      expiresIn: "5 minutes",
    });
  } catch (err) {
    logger.error(`Face verify error: ${err.message}`);
    res.status(500).json({ error: "Face verification failed." });
  }
};
