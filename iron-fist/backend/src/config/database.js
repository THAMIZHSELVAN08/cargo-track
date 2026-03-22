/**
 * Database Configuration
 * Establishes and manages MongoDB connection via Mongoose
 */

const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting reconnect...");
    });
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    // process.exit(1); // Exit process if DB cannot be reached
  }
};

module.exports = connectDB;
