const User = require("../models/User")

// Check if user has required role
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId)

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        })
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          status: "error",
          message: "Access denied. Insufficient permissions.",
        })
      }

      req.user.role = user.role
      next()
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Authorization check failed",
      })
    }
  }
}

// Specific role middleware
const requireAdmin = requireRole(["admin"])
const requireManagerOrAdmin = requireRole(["manager", "admin"])
const requireAnyRole = requireRole(["user", "manager", "admin"])

module.exports = {
  requireRole,
  requireAdmin,
  requireManagerOrAdmin,
  requireAnyRole,
}
