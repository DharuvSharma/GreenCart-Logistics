const rateLimit = require("express-rate-limit")
const slowDown = require("express-slow-down")
const hpp = require("hpp")
const xss = require("xss-clean")

// Rate limiting for different endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: "error",
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// General API rate limiting
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  "Too many requests from this IP, please try again later.",
)

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  "Too many authentication attempts, please try again later.",
)

// Simulation rate limiting (resource intensive)
const simulationLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // limit each IP to 3 simulations per hour
  "Too many simulation requests, please try again later.",
)

// Speed limiting for expensive operations
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 50
  maxDelayMs: 20000, // maximum delay of 20 seconds
})

// HTTP Parameter Pollution protection
const hppProtection = hpp({
  whitelist: ["sort", "fields", "page", "limit", "status", "priority"],
})

// XSS protection
const xssProtection = xss()

module.exports = {
  generalLimiter,
  authLimiter,
  simulationLimiter,
  speedLimiter,
  hppProtection,
  xssProtection,
}
