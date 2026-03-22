const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const gpsController = require("../controllers/gps.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: GPS
 *   description: Real-time GPS tracking and geofencing
 */

/**
 * @swagger
 * /gps/update:
 *   post:
 *     summary: Driver submits a GPS location update
 *     tags: [GPS]
 */
router.post(
  "/update",
  authenticate,
  authorize("driver"),
  [
    body("containerId").notEmpty().withMessage("containerId required"),
    body("lat").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
    body("lng").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
    body("speed").optional().isFloat({ min: 0 }).withMessage("Speed must be a positive number"),
  ],
  validate,
  gpsController.updateLocation
);

router.get("/live/:containerId", authenticate, gpsController.getLiveLocation);
router.get("/history/:containerId", authenticate, gpsController.getLocationHistory);
router.get("/all", authenticate, authorize("dispatcher", "admin"), gpsController.getAllLiveLocations);

module.exports = router;
