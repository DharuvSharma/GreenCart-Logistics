const Route = require("../models/Route")
const Order = require("../models/Order")
const logger = require("../utils/logger")

// @desc    Get all routes
// @route   GET /api/routes
// @access  Private
const getRoutes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      trafficLevel,
      difficulty,
      isActive,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build filter object
    const filter = {}
    if (trafficLevel) filter.trafficLevel = trafficLevel
    if (difficulty) filter.difficulty = difficulty
    if (isActive !== undefined) filter.isActive = isActive === "true"
    if (search) {
      filter.$or = [
        { routeId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { "startLocation.address": { $regex: search, $options: "i" } },
        { "endLocation.address": { $regex: search, $options: "i" } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 }

    // Execute query
    const routes = await Route.find(filter).sort(sortOptions).skip(skip).limit(Number.parseInt(limit))

    const total = await Route.countDocuments(filter)

    res.status(200).json({
      status: "success",
      data: {
        routes,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    logger.error("Get routes error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch routes",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Get single route
// @route   GET /api/routes/:id
// @access  Private
const getRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)

    if (!route) {
      return res.status(404).json({
        status: "error",
        message: "Route not found",
      })
    }

    // Get route's recent orders
    const recentOrders = await Order.find({ assignedRoute: route._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedDriver", "name employeeId")

    res.status(200).json({
      status: "success",
      data: {
        route,
        recentOrders,
        fuelCost: route.calculateFuelCost(),
        trafficMultiplier: route.getTrafficMultiplier(),
      },
    })
  } catch (error) {
    logger.error("Get route error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch route",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Create new route
// @route   POST /api/routes
// @access  Private (Admin/Manager)
const createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body)

    logger.info(`New route created: ${route.routeId} - ${route.name}`)

    res.status(201).json({
      status: "success",
      message: "Route created successfully",
      data: { route },
    })
  } catch (error) {
    logger.error("Create route error:", error)

    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Route with this ID already exists",
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to create route",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private (Admin/Manager)
const updateRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!route) {
      return res.status(404).json({
        status: "error",
        message: "Route not found",
      })
    }

    logger.info(`Route updated: ${route.routeId} - ${route.name}`)

    res.status(200).json({
      status: "success",
      message: "Route updated successfully",
      data: { route },
    })
  } catch (error) {
    logger.error("Update route error:", error)

    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Route with this ID already exists",
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to update route",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private (Admin)
const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)

    if (!route) {
      return res.status(404).json({
        status: "error",
        message: "Route not found",
      })
    }

    // Check if route has active orders
    const activeOrders = await Order.countDocuments({
      assignedRoute: route._id,
      status: { $in: ["pending", "assigned", "in-progress"] },
    })

    if (activeOrders > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete route with active orders. Please reassign or complete orders first.",
      })
    }

    await Route.findByIdAndDelete(req.params.id)

    logger.info(`Route deleted: ${route.routeId} - ${route.name}`)

    res.status(200).json({
      status: "success",
      message: "Route deleted successfully",
    })
  } catch (error) {
    logger.error("Delete route error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to delete route",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

module.exports = {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
}
