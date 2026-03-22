const express = require("express");
const router = express.Router();
const logController = require("../controllers/log.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Event log retrieval and blockchain verification
 */

router.get("/", authenticate, authorize("dispatcher", "admin"), logController.getLogs);
router.get("/stats", authenticate, authorize("dispatcher", "admin"), logController.getStats);
router.get("/:id", authenticate, authorize("dispatcher", "admin"), logController.getLog);

module.exports = router;
