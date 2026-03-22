/**
 * Iron Fist - Main Server Entry Point
 * Initializes Express app, connects to MongoDB, sets up middleware and routes
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const connectDB = require("./config/database");
const logger = require("./utils/logger");

// Service imports
const blockchainService = require("./services/blockchain.service");

// Route imports
const authRoutes = require("./routes/auth.routes");
const unlockRoutes = require("./routes/unlock.routes");
const gpsRoutes = require("./routes/gps.routes");
const aiRoutes = require("./routes/ai.routes");
const immobilizeRoutes = require("./routes/immobilize.routes");
const logRoutes = require("./routes/log.routes");
const biometricRoutes = require("./routes/biometric.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Parsing Middleware ──────────────────────────────────────────────
app.use(helmet()); // Secure HTTP headers
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased for admin dashboard polling
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ── Swagger API Documentation ──────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/unlock", unlockRoutes);
app.use("/api/gps", gpsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/immobilize", immobilizeRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/biometric", biometricRoutes);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Iron Fist Backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ── Start Server ───────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await blockchainService.init(); // Initialize blockchain connection
  app.listen(PORT, () => {
    logger.info(`🚀 Iron Fist server running on port ${PORT}`);
    logger.info(`📚 Swagger docs: http://localhost:${PORT}/api/docs`);
  });
};

startServer();

module.exports = app; // For testing
