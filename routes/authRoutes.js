const express = require("express")
const { body } = require("express-validator")
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyToken,
} = require("../controllers/authController")
const auth = require("../middleware/auth")
const validate = require("../middleware/validate")

const router = express.Router()

// Validation rules
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  body("role").optional().isIn(["admin", "manager", "user"]).withMessage("Invalid role"),
]

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

const updateProfileValidation = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
]

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
]

// Public routes
router.post("/register", registerValidation, validate, register)
router.post("/login", loginValidation, validate, login)

// Protected routes
router.use(auth) // Apply auth middleware to all routes below

router.get("/profile", getProfile)
router.put("/profile", updateProfileValidation, validate, updateProfile)
router.put("/change-password", changePasswordValidation, validate, changePassword)
router.post("/logout", logout)
router.get("/verify", verifyToken)

module.exports = router
