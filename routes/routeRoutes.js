const express = require("express")
const { body } = require("express-validator")
const { getRoutes, getRoute, createRoute, updateRoute, deleteRoute } = require("../controllers/routeController")
const auth = require("../middleware/auth")
const { requireManagerOrAdmin, requireAdmin } = require("../middleware/roleAuth")
const validate = require("../middleware/validate")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// Validation rules
const routeValidation = [
  body("routeId").trim().notEmpty().withMessage("Route ID is required"),
  body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Route name must be between 1 and 100 characters"),
  body("distance").isNumeric().isFloat({ min: 0.1, max: 1000 }).withMessage("Distance must be between 0.1 and 1000 km"),
  body("trafficLevel").isIn(["Low", "Medium", "High"]).withMessage("Traffic level must be Low, Medium, or High"),
  body("baseTime").isInt({ min: 1, max: 1440 }).withMessage("Base time must be between 1 and 1440 minutes"),
  body("startLocation.address").trim().notEmpty().withMessage("Start location address is required"),
  body("endLocation.address").trim().notEmpty().withMessage("End location address is required"),
  body("fuelCostPerKm")
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage("Fuel cost per km must be a positive number"),
  body("difficulty")
    .optional()
    .isIn(["Easy", "Medium", "Hard"])
    .withMessage("Difficulty must be Easy, Medium, or Hard"),
]

// Routes
router.get("/", getRoutes)
router.get("/:id", getRoute)
router.post("/", requireManagerOrAdmin, routeValidation, validate, createRoute)
router.put("/:id", requireManagerOrAdmin, routeValidation, validate, updateRoute)
router.delete("/:id", requireAdmin, deleteRoute)

module.exports = router
