const express = require("express");
const router = express.Router();
const biometricController = require("../controllers/biometric.controller");
const { authenticate } = require("../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Biometric
 *   description: Fingerprint and face verification (simulated)
 */

router.post("/fingerprint", authenticate, biometricController.verifyFingerprintEndpoint);

router.post(
  "/face",
  authenticate,
  biometricController.uploadMiddleware,
  biometricController.verifyFaceEndpoint
);

module.exports = router;
