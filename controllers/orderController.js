const Order = require("../models/Order")
const Driver = require("../models/Driver")
const Route = require("../models/Route")
const logger = require("../utils/logger")

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedDriver,
      assignedRoute,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build filter object
    const filter = {}
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (assignedDriver) filter.assignedDriver = assignedDriver
    if (assignedRoute) filter.assignedRoute = assignedRoute
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "customerInfo.name": { $regex: search, $options: "i" } },
        { "customerInfo.phone": { $regex: search, $options: "i" } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 }

    // Execute query with population
    const orders = await Order.find(filter)
      .populate("assignedRoute", "routeId name distance trafficLevel")
      .populate("assignedDriver", "name employeeId rating")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Order.countDocuments(filter)

    res.status(200).json({
      status: "success",
      data: {
        orders,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    logger.error("Get orders error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("assignedRoute").populate("assignedDriver")

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      })
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
        isLate: order.isLate(),
        deliveryBonus: order.calculateDeliveryBonus(),
      },
    })
  } catch (error) {
    logger.error("Get order error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Admin/Manager)
const createOrder = async (req, res) => {
  try {
    const { assignedRoute, assignedDriver, ...orderData } = req.body

    // Validate route exists
    if (assignedRoute) {
      const route = await Route.findById(assignedRoute)
      if (!route) {
        return res.status(400).json({
          status: "error",
          message: "Assigned route not found",
        })
      }
    }

    // Validate driver exists and can take more orders
    if (assignedDriver) {
      const driver = await Driver.findById(assignedDriver)
      if (!driver) {
        return res.status(400).json({
          status: "error",
          message: "Assigned driver not found",
        })
      }
      if (driver.status !== "active") {
        return res.status(400).json({
          status: "error",
          message: "Assigned driver is not active",
        })
      }
    }

    const order = await Order.create({
      ...orderData,
      assignedRoute,
      assignedDriver,
    })

    await order.populate("assignedRoute assignedDriver")

    logger.info(`New order created: ${order.orderId}`)

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      data: { order },
    })
  } catch (error) {
    logger.error("Create order error:", error)

    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Order with this ID already exists",
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to create order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private (Admin/Manager)
const updateOrder = async (req, res) => {
  try {
    const { assignedRoute, assignedDriver, ...updateData } = req.body

    // Validate route if being updated
    if (assignedRoute) {
      const route = await Route.findById(assignedRoute)
      if (!route) {
        return res.status(400).json({
          status: "error",
          message: "Assigned route not found",
        })
      }
    }

    // Validate driver if being updated
    if (assignedDriver) {
      const driver = await Driver.findById(assignedDriver)
      if (!driver) {
        return res.status(400).json({
          status: "error",
          message: "Assigned driver not found",
        })
      }
      if (driver.status !== "active") {
        return res.status(400).json({
          status: "error",
          message: "Assigned driver is not active",
        })
      }
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        ...updateData,
        ...(assignedRoute && { assignedRoute }),
        ...(assignedDriver && { assignedDriver }),
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("assignedRoute assignedDriver")

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      })
    }

    logger.info(`Order updated: ${order.orderId}`)

    res.status(200).json({
      status: "success",
      message: "Order updated successfully",
      data: { order },
    })
  } catch (error) {
    logger.error("Update order error:", error)

    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Order with this ID already exists",
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to update order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      })
    }

    // Prevent deletion of in-progress orders
    if (order.status === "in-progress") {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete order that is in progress",
      })
    }

    await Order.findByIdAndDelete(req.params.id)

    logger.info(`Order deleted: ${order.orderId}`)

    res.status(200).json({
      status: "success",
      message: "Order deleted successfully",
    })
  } catch (error) {
    logger.error("Delete order error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to delete order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Mark order as delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private
const markAsDelivered = async (req, res) => {
  try {
    const { actualTimeMinutes, feedback } = req.body
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      })
    }

    if (order.status !== "in-progress") {
      return res.status(400).json({
        status: "error",
        message: "Order must be in progress to mark as delivered",
      })
    }

    // Mark as delivered
    await order.markAsDelivered(actualTimeMinutes)

    // Add feedback if provided
    if (feedback) {
      order.feedback = feedback
      await order.save()
    }

    // Update route average time
    if (order.assignedRoute && actualTimeMinutes) {
      const route = await Route.findById(order.assignedRoute)
      if (route) {
        await route.updateAverageTime(actualTimeMinutes)
      }
    }

    await order.populate("assignedRoute assignedDriver")

    logger.info(`Order marked as delivered: ${order.orderId}`)

    res.status(200).json({
      status: "success",
      message: "Order marked as delivered successfully",
      data: {
        order,
        deliveryBonus: order.calculateDeliveryBonus(),
      },
    })
  } catch (error) {
    logger.error("Mark as delivered error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to mark order as delivered",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  markAsDelivered,
}
