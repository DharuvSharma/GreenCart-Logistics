const jwt = require("jsonwebtoken")
const User = require("../models/User")
const logger = require("../utils/logger")

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  })
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User with this email or username already exists",
      })
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role || "user",
    })

    // Generate token
    const token = generateToken(user._id)

    // Update last login
    await user.updateLastLogin()

    logger.info(`New user registered: ${user.email}`)

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
      },
    })
  } catch (error) {
    logger.error("Registration error:", error)
    res.status(500).json({
      status: "error",
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide email and password",
      })
    }

    // Find user and include password
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated. Please contact administrator.",
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Update last login
    await user.updateLastLogin()

    logger.info(`User logged in: ${user.email}`)

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
      },
    })
  } catch (error) {
    logger.error("Login error:", error)
    res.status(500).json({
      status: "error",
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      })
    }

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    logger.error("Get profile error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to get profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body
    const userId = req.user.userId

    // Check if new email/username already exists (excluding current user)
    if (email || username) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [{ email }, { username }].filter(Boolean),
      })

      if (existingUser) {
        return res.status(400).json({
          status: "error",
          message: "Email or username already exists",
        })
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { ...(username && { username }), ...(email && { email }) },
      { new: true, runValidators: true },
    )

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      })
    }

    logger.info(`User profile updated: ${user.email}`)

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
      },
    })
  } catch (error) {
    logger.error("Update profile error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.userId

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Please provide current password and new password",
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "New password must be at least 6 characters long",
      })
    }

    // Find user with password
    const user = await User.findById(userId).select("+password")

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      })
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    logger.info(`Password changed for user: ${user.email}`)

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    })
  } catch (error) {
    logger.error("Change password error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to change password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // This endpoint can be used for logging purposes
    const user = await User.findById(req.user.userId)

    if (user) {
      logger.info(`User logged out: ${user.email}`)
    }

    res.status(200).json({
      status: "success",
      message: "Logout successful",
    })
  } catch (error) {
    logger.error("Logout error:", error)
    res.status(500).json({
      status: "error",
      message: "Logout failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      })
    }

    res.status(200).json({
      status: "success",
      message: "Token is valid",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    logger.error("Token verification error:", error)
    res.status(401).json({
      status: "error",
      message: "Token verification failed",
    })
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyToken,
}
