/**
 * Swagger / OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 */

const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Iron Fist API",
      version: "1.0.0",
      description:
        "Smart Cargo Security Platform — Biometric unlock, GPS tracking, AI anomaly detection, blockchain logging",
      contact: { name: "Iron Fist Team" },
    },
    servers: [{ url: "http://localhost:5000/api", description: "Development" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

module.exports = swaggerJsDoc(options);
