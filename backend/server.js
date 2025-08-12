const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")
const driverRoutes = require("./routes/driverRoutes")
const routeRoutes = require("./routes/routeRoutes")
const orderRoutes = require("./routes/orderRoutes")
const simulationRoutes = require("./routes/simulationRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")

const errorHandler = require("./utils/errorHandler")
const logger = require("./utils/logger")
const requestLogger = require("./middleware/requestLogger")
const {
  generalLimiter,
  authLimiter,
  simulationLimiter,
  speedLimiter,
  hppProtection,
  xssProtection,
} = require("./middleware/security")

const app = express()
const PORT = process.env.PORT || 5000

// Trust proxy (for rate limiting behind reverse proxy)
app.set("trust proxy", 1)

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
)

// Compression middleware
app.use(compression())

// XSS protection
app.use(xssProtection)

// HTTP Parameter Pollution protection
app.use(hppProtection)

// Request logging
app.use(requestLogger)

// Rate limiting
app.use("/api/auth", authLimiter)
app.use("/api/simulation", simulationLimiter)
app.use("/api/", generalLimiter)
app.use(speedLimiter)

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/drivers", driverRoutes)
app.use("/api/routes", routeRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/simulation", simulationRoutes)
app.use("/api/dashboard", dashboardRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "GreenCart Logistics API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  })
})

// API documentation (only in development)
if (process.env.NODE_ENV !== "production") {
  const swaggerSetup = require("./config/swagger")
  swaggerSetup(app)
}

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  })
})

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Connected to MongoDB Atlas")
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`)
      if (process.env.NODE_ENV !== "production") {
        logger.info(`API Documentation: http://localhost:${PORT}/api-docs`)
      }
    })
  })
  .catch((error) => {
    logger.error("Database connection error:", error)
    process.exit(1)
  })

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`)

  const server = app.listen()
  server.close(() => {
    logger.info("HTTP server closed.")

    mongoose.connection.close(() => {
      logger.info("MongoDB connection closed.")
      process.exit(0)
    })
  })

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down")
    process.exit(1)
  }, 30000)
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err)
  process.exit(1)
})

module.exports = app
