const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const mongoSanitize = require("express-mongo-sanitize")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")
const driverRoutes = require("./routes/driverRoutes")
const routeRoutes = require("./routes/routeRoutes")
const orderRoutes = require("./routes/orderRoutes")
const simulationRoutes = require("./routes/simulationRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")

const errorHandler = require("./utils/errorHandler")
const logger = require("./utils/logger")

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(mongoSanitize())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
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
  })
})

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
    })
  })
  .catch((error) => {
    logger.error("Database connection error:", error)
    process.exit(1)
  })

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...")
  mongoose.connection.close(() => {
    logger.info("MongoDB connection closed.")
    process.exit(0)
  })
})

module.exports = app
