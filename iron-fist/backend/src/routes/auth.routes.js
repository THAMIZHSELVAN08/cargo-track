/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management
 */

const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [driver, dispatcher, admin] }
 *               biometricFingerprintId: { type: string }
 *               assignedContainerId: { type: string }
 */
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["driver", "dispatcher", "admin"]).withMessage("Invalid role"),
  ],
  validate,
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive JWT token
 *     tags: [Auth]
 *     security: []
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validate,
  authController.login
);

/** @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth] */
router.get("/me", authenticate, authController.getMe);

router.post("/logout", authenticate, authController.logout);

router.put("/update-profile", authenticate, authController.updateProfile);

router.get("/users", authenticate, authorize("admin"), authController.listUsers);

router.put("/users/:id", authenticate, authorize("admin"), authController.updateUser);

router.put("/users/update-by-container/:containerId", authenticate, authorize("admin"), authController.updateByContainer);

module.exports = router;
