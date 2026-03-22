const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered anomaly detection
 */

router.post(
  "/analyze",
  authenticate,
  [
    body("lat").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
    body("lng").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
    body("speed").isFloat({ min: 0 }).withMessage("Valid speed required"),
    body("containerId").notEmpty().withMessage("containerId required"),
  ],
  validate,
  aiController.analyze
);

router.post("/analyze/batch", authenticate, aiController.analyzeBatch);
router.get("/health", aiController.healthCheck);

module.exports = router;
