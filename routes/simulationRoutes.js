const express = require("express")
const { body } = require("express-validator")
const { runSimulation, getSimulationStatus } = require("../controllers/simulationController")
const auth = require("../middleware/auth")
const { requireManagerOrAdmin } = require("../middleware/roleAuth")
const validate = require("../middleware/validate")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// Validation rules for simulation
const simulationValidation = [
  body("numberOfDrivers").isInt({ min: 1, max: 50 }).withMessage("Number of drivers must be between 1 and 50"),
  body("maxHoursPerDriver").isInt({ min: 1, max: 24 }).withMessage("Max hours per driver must be between 1 and 24"),
  body("startTime").optional().isISO8601().withMessage("Start time must be a valid ISO 8601 date"),
]

// Routes
router.post("/run", requireManagerOrAdmin, simulationValidation, validate, runSimulation)
router.get("/status", getSimulationStatus)

module.exports = router
