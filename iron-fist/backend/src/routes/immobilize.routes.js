const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const immobilizeController = require("../controllers/immobilize.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: Immobilize
 *   description: Remote engine immobilization control
 */

/**
 * @swagger
 * /immobilize:
 *   post:
 *     summary: Stop or start a vehicle engine remotely
 *     tags: [Immobilize]
 */
router.post(
  "/",
  authenticate,
  authorize("dispatcher", "admin"),
  [
    body("containerId").notEmpty().withMessage("containerId required"),
    body("action").isIn(["STOP", "START"]).withMessage("action must be STOP or START"),
    body("reason").optional().isString(),
  ],
  validate,
  immobilizeController.setEngineState
);

router.get("/status/all", authenticate, immobilizeController.getAllEngineStatus);
router.get("/status/:containerId", authenticate, immobilizeController.getEngineStatus);

module.exports = router;
