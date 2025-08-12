const Driver = require("../models/Driver")
const Order = require("../models/Order")
const logger = require("../utils/logger")

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
const getDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sortBy = "createdAt", sortOrder = "desc" } = req.query

    // Build filter object
    const filter = {}
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { licenseNumber: { $regex: search, $options: "i" } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 }

    // Execute query
    const drivers = await Driver.find(filter).sort(sortOptions).skip(skip).limit(Number.parseInt(limit))

    const total = await Driver.countDocuments(filter)

    res.status(200).json({
      status: "success",
      data: {
        drivers,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    logger.error("Get drivers error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch drivers",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private
const getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)

    if (!driver) {
      return res.status(404).json({
        status: "error",
        message: "Driver not found",
      })
    }

    // Get driver's recent orders
    const recentOrders = await Order.find({ assignedDriver: driver._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedRoute", "routeId name")

    res.status(200).json({
      status: "success",
      data: {
        driver,
        recentOrders,
      },
    })
  } catch (error) {
    logger.error("Get driver error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch driver",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Create new driver
// @route   POST /api/drivers
// @access  Private (Admin/Manager)
const createDriver = async (req, res) => {
  try {
    const driver = await Driver.create(req.body)

    logger.info(`New driver created: ${driver.name} (${driver.employeeId})`)

    res.status(201).json({
      status: "success",
      message: "Driver created successfully",
      data: { driver },
    })
  } catch (error) {
    logger.error("Create driver error:", error)

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0]
      return res.status(400).json({
        status: "error",
        message: `Driver with this ${field} already exists`,
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to create driver",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private (Admin/Manager)
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!driver) {
      return res.status(404).json({
        status: "error",
        message: "Driver not found",
      })
    }

    logger.info(`Driver updated: ${driver.name} (${driver.employeeId})`)

    res.status(200).json({
      status: "success",
      message: "Driver updated successfully",
      data: { driver },
    })
  } catch (error) {
    logger.error("Update driver error:", error)

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0]
      return res.status(400).json({
        status: "error",
        message: `Driver with this ${field} already exists`,
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to update driver",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private (Admin)
const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)

    if (!driver) {
      return res.status(404).json({
        status: "error",
        message: "Driver not found",
      })
    }

    // Check if driver has active orders
    const activeOrders = await Order.countDocuments({
      assignedDriver: driver._id,
      status: { $in: ["assigned", "in-progress"] },
    })

    if (activeOrders > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete driver with active orders. Please reassign or complete orders first.",
      })
    }

    await Driver.findByIdAndDelete(req.params.id)

    logger.info(`Driver deleted: ${driver.name} (${driver.employeeId})`)

    res.status(200).json({
      status: "success",
      message: "Driver deleted successfully",
    })
  } catch (error) {
    logger.error("Delete driver error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to delete driver",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Get driver statistics
// @route   GET /api/drivers/:id/stats
// @access  Private
const getDriverStats = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)

    if (!driver) {
      return res.status(404).json({
        status: "error",
        message: "Driver not found",
      })
    }

    // Calculate statistics
    const totalOrders = await Order.countDocuments({ assignedDriver: driver._id })
    const completedOrders = await Order.countDocuments({
      assignedDriver: driver._id,
      status: "delivered",
    })
    const lateOrders = await Order.countDocuments({
      assignedDriver: driver._id,
      status: "late",
    })

    const onTimeRate = totalOrders > 0 ? ((completedOrders - lateOrders) / totalOrders) * 100 : 0

    // Calculate total earnings (simplified)
    const totalEarnings = driver.past7DayHours * driver.hourlyRate

    res.status(200).json({
      status: "success",
      data: {
        driver: {
          id: driver._id,
          name: driver.name,
          employeeId: driver.employeeId,
        },
        stats: {
          totalOrders,
          completedOrders,
          lateOrders,
          onTimeRate: Math.round(onTimeRate * 100) / 100,
          totalEarnings,
          currentShiftHours: driver.currentShiftHours,
          past7DayHours: driver.past7DayHours,
          rating: driver.rating,
          fatigueFactor: driver.getFatigueFactor(),
        },
      },
    })
  } catch (error) {
    logger.error("Get driver stats error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch driver statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

module.exports = {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverStats,
}
