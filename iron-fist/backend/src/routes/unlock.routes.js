/**
 * @swagger
 * tags:
 *   name: Unlock
 *   description: Container unlock request lifecycle
 */

const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const unlockController = require("../controllers/unlock.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

/**
 * @swagger
 * /unlock/request:
 *   post:
 *     summary: Driver submits an unlock request
 *     tags: [Unlock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [containerId, lat, lng, biometricSessionId]
 *             properties:
 *               containerId: { type: string }
 *               lat: { type: number }
 *               lng: { type: number }
 *               biometricSessionId: { type: string }
 */
router.post(
  "/request",
  authenticate,
  authorize("driver"),
  [
    body("containerId").notEmpty().withMessage("containerId required"),
    body("lat").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
    body("lng").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
    body("biometricSessionId").notEmpty().withMessage("biometricSessionId required"),
  ],
  validate,
  unlockController.requestUnlock
);

/**
 * @swagger
 * /unlock/approve:
 *   post:
 *     summary: Dispatcher approves or rejects an unlock request
 *     tags: [Unlock]
 */
router.post(
  "/approve",
  authenticate,
  authorize("dispatcher", "admin"),
  [
    body("requestId").notEmpty().withMessage("requestId required"),
    body("action").isIn(["APPROVE", "REJECT"]).withMessage("action must be APPROVE or REJECT"),
  ],
  validate,
  unlockController.approveUnlock
);

router.get("/requests", authenticate, authorize("dispatcher", "admin"), unlockController.listRequests);

router.get("/status/:requestId", authenticate, unlockController.getRequestStatus);

module.exports = router;
