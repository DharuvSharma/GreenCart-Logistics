const express = require("express")
const { body } = require("express-validator")
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  markAsDelivered,
} = require("../controllers/orderController")
const auth = require("../middleware/auth")
const { requireManagerOrAdmin, requireAdmin } = require("../middleware/roleAuth")
const validate = require("../middleware/validate")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// Validation rules
const orderValidation = [
  body("orderId").trim().notEmpty().withMessage("Order ID is required"),
  body("valueRs")
    .isNumeric()
    .isFloat({ min: 1, max: 1000000 })
    .withMessage("Order value must be between Rs. 1 and Rs. 10,00,000"),
  body("assignedRoute").isMongoId().withMessage("Valid assigned route ID is required"),
  body("customerInfo.name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Customer name must be between 1 and 100 characters"),
  body("customerInfo.phone")
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please provide a valid customer phone number"),
  body("customerInfo.address")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Customer address must be between 1 and 200 characters"),
  body("scheduledDeliveryTime").isISO8601().withMessage("Please provide a valid scheduled delivery time"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  body("assignedDriver").optional().isMongoId().withMessage("Valid assigned driver ID is required"),
]

const deliveryValidation = [
  body("actualTimeMinutes").isInt({ min: 1 }).withMessage("Actual time in minutes is required and must be positive"),
  body("feedback.rating").optional().isInt({ min: 1, max: 5 }).withMessage("Feedback rating must be between 1 and 5"),
  body("feedback.comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Feedback comment cannot exceed 500 characters"),
]

// Routes
router.get("/", getOrders)
router.get("/:id", getOrder)
router.post("/", requireManagerOrAdmin, orderValidation, validate, createOrder)
router.put("/:id", requireManagerOrAdmin, orderValidation, validate, updateOrder)
router.put("/:id/deliver", deliveryValidation, validate, markAsDelivered)
router.delete("/:id", requireAdmin, deleteOrder)

module.exports = router
