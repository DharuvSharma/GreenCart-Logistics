const express = require("express")
const { body } = require("express-validator")
const {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverStats,
} = require("../controllers/driverController")
const auth = require("../middleware/auth")
const { requireManagerOrAdmin, requireAdmin } = require("../middleware/roleAuth")
const validate = require("../middleware/validate")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// Validation rules
const driverValidation = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("employeeId").trim().notEmpty().withMessage("Employee ID is required"),
  body("hourlyRate").isNumeric().isFloat({ min: 0 }).withMessage("Hourly rate must be a positive number"),
  body("licenseNumber").trim().notEmpty().withMessage("License number is required"),
  body("phoneNumber")
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please provide a valid phone number"),
  body("maxHoursPerDay")
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage("Max hours per day must be between 1 and 24"),
  body("status")
    .optional()
    .isIn(["active", "inactive", "on-leave"])
    .withMessage("Status must be active, inactive, or on-leave"),
]

// Routes
router.get("/", getDrivers)
router.get("/:id", getDriver)
router.get("/:id/stats", getDriverStats)
router.post("/", requireManagerOrAdmin, driverValidation, validate, createDriver)
router.put("/:id", requireManagerOrAdmin, driverValidation, validate, updateDriver)
router.delete("/:id", requireAdmin, deleteDriver)

module.exports = router
