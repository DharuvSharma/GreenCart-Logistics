const Driver = require("../models/Driver")
const Route = require("../models/Route")
const Order = require("../models/Order")
const logger = require("../utils/logger")

// @desc    Get dashboard KPIs
// @route   GET /api/dashboard/kpis
// @access  Private
const getDashboardKPIs = async (req, res) => {
  try {
    const { timeRange = "7d" } = req.query

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "24h":
        startDate.setHours(now.getHours() - 24)
        break
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get orders within time range
    const orders = await Order.find({
      createdAt: { $gte: startDate },
    }).populate("assignedRoute")

    // Calculate KPIs
    const totalOrders = orders.length
    const deliveredOrders = orders.filter((order) => order.status === "delivered")
    const lateOrders = orders.filter((order) => order.status === "late" || order.isLate())
    const onTimeOrders = deliveredOrders.filter((order) => !order.isLate())

    // Calculate total profit (simplified)
    let totalProfit = 0
    let totalFuelCost = 0

    for (const order of deliveredOrders) {
      const revenue = order.valueRs * 0.1 // 10% commission
      const fuelCost = order.assignedRoute ? order.assignedRoute.calculateFuelCost() : 0
      const driverCost = order.actualDeliveryTime ? (order.actualDeliveryTime / 60) * 150 : 0 // Avg hourly rate

      totalProfit += revenue - fuelCost - driverCost + order.calculateDeliveryBonus()
      totalFuelCost += fuelCost
    }

    // Calculate efficiency score
    const onTimeRate = totalOrders > 0 ? (onTimeOrders.length / totalOrders) * 100 : 0
    const completionRate = totalOrders > 0 ? (deliveredOrders.length / totalOrders) * 100 : 0
    const efficiencyScore = onTimeRate * 0.6 + completionRate * 0.4

    // Get previous period for trend calculation
    const prevStartDate = new Date(startDate)
    const prevEndDate = new Date(startDate)
    const timeDiff = now.getTime() - startDate.getTime()
    prevStartDate.setTime(prevStartDate.getTime() - timeDiff)

    const prevOrders = await Order.find({
      createdAt: { $gte: prevStartDate, $lt: startDate },
    }).populate("assignedRoute")

    const prevDeliveredOrders = prevOrders.filter((order) => order.status === "delivered")
    let prevTotalProfit = 0

    for (const order of prevDeliveredOrders) {
      const revenue = order.valueRs * 0.1
      const fuelCost = order.assignedRoute ? order.assignedRoute.calculateFuelCost() : 0
      const driverCost = order.actualDeliveryTime ? (order.actualDeliveryTime / 60) * 150 : 0
      prevTotalProfit += revenue - fuelCost - driverCost + order.calculateDeliveryBonus()
    }

    // Calculate trends
    const profitTrend = prevTotalProfit > 0 ? ((totalProfit - prevTotalProfit) / prevTotalProfit) * 100 : 0
    const prevOnTimeRate =
      prevOrders.length > 0 ? (prevOrders.filter((o) => !o.isLate()).length / prevOrders.length) * 100 : 0
    const onTimeTrend = prevOnTimeRate > 0 ? ((onTimeRate - prevOnTimeRate) / prevOnTimeRate) * 100 : 0

    const kpis = {
      totalProfit: {
        value: Math.round(totalProfit),
        trend: Math.round(profitTrend * 100) / 100,
        label: "Total Profit",
        format: "currency",
      },
      efficiencyScore: {
        value: Math.round(efficiencyScore * 100) / 100,
        trend: Math.round(onTimeTrend * 100) / 100,
        label: "Efficiency Score",
        format: "percentage",
      },
      onTimeDeliveries: {
        value: onTimeOrders.length,
        trend: onTimeOrders.length - prevOrders.filter((o) => !o.isLate()).length,
        label: "On-time Deliveries",
        format: "number",
      },
      lateDeliveries: {
        value: lateOrders.length,
        trend: lateOrders.length - prevOrders.filter((o) => o.isLate()).length,
        label: "Late Deliveries",
        format: "number",
      },
    }

    res.status(200).json({
      status: "success",
      data: {
        kpis,
        timeRange,
        summary: {
          totalOrders,
          deliveredOrders: deliveredOrders.length,
          onTimeRate: Math.round(onTimeRate * 100) / 100,
          totalFuelCost: Math.round(totalFuelCost),
        },
      },
    })
  } catch (error) {
    logger.error("Get dashboard KPIs error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch dashboard KPIs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Get chart data for dashboard
// @route   GET /api/dashboard/charts
// @access  Private
const getChartData = async (req, res) => {
  try {
    const { timeRange = "7d" } = req.query

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "24h":
        startDate.setHours(now.getHours() - 24)
        break
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get orders within time range
    const orders = await Order.find({
      createdAt: { $gte: startDate },
    }).populate("assignedRoute")

    // Delivery Status Pie Chart Data
    const statusCounts = {
      delivered: orders.filter((o) => o.status === "delivered" && !o.isLate()).length,
      late: orders.filter((o) => o.status === "late" || o.isLate()).length,
      "in-progress": orders.filter((o) => o.status === "in-progress").length,
      pending: orders.filter((o) => o.status === "pending").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }

    const deliveryStatusData = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        fill: getStatusColor(status),
      }))

    // Fuel Costs Bar Chart Data (by route)
    const routeFuelCosts = {}
    const deliveredOrdersWithRoutes = orders.filter((o) => o.status === "delivered" && o.assignedRoute)

    for (const order of deliveredOrdersWithRoutes) {
      const routeId = order.assignedRoute.routeId
      if (!routeFuelCosts[routeId]) {
        routeFuelCosts[routeId] = {
          route: routeId,
          totalCost: 0,
          orderCount: 0,
        }
      }
      routeFuelCosts[routeId].totalCost += order.assignedRoute.calculateFuelCost()
      routeFuelCosts[routeId].orderCount += 1
    }

    const fuelCostData = Object.values(routeFuelCosts)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10) // Top 10 routes
      .map((item) => ({
        route: item.route,
        cost: Math.round(item.totalCost),
        orders: item.orderCount,
        avgCost: Math.round(item.totalCost / item.orderCount),
      }))

    // Daily Performance Line Chart Data
    const dailyData = {}
    const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      dailyData[dateStr] = {
        date: dateStr,
        delivered: 0,
        late: 0,
        revenue: 0,
      }
    }

    for (const order of orders) {
      const dateStr = order.createdAt.toISOString().split("T")[0]
      if (dailyData[dateStr]) {
        if (order.status === "delivered") {
          if (order.isLate()) {
            dailyData[dateStr].late += 1
          } else {
            dailyData[dateStr].delivered += 1
          }
          dailyData[dateStr].revenue += order.valueRs * 0.1 // 10% commission
        }
      }
    }

    const performanceData = Object.values(dailyData).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue),
    }))

    res.status(200).json({
      status: "success",
      data: {
        deliveryStatus: deliveryStatusData,
        fuelCosts: fuelCostData,
        dailyPerformance: performanceData,
        timeRange,
      },
    })
  } catch (error) {
    logger.error("Get chart data error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch chart data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Get system statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getSystemStats = async (req, res) => {
  try {
    // Get overall system statistics
    const totalDrivers = await Driver.countDocuments()
    const activeDrivers = await Driver.countDocuments({ status: "active" })
    const totalRoutes = await Route.countDocuments()
    const activeRoutes = await Route.countDocuments({ isActive: true })
    const totalOrders = await Order.countDocuments()
    const pendingOrders = await Order.countDocuments({ status: "pending" })

    // Get top performing drivers
    const topDrivers = await Driver.find({ status: "active" })
      .sort({ rating: -1, totalDeliveries: -1 })
      .limit(5)
      .select("name employeeId rating totalDeliveries")

    // Get most used routes
    const routeUsage = await Order.aggregate([
      { $match: { assignedRoute: { $exists: true } } },
      { $group: { _id: "$assignedRoute", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "routes",
          localField: "_id",
          foreignField: "_id",
          as: "route",
        },
      },
      { $unwind: "$route" },
      {
        $project: {
          routeId: "$route.routeId",
          name: "$route.name",
          usage: "$count",
        },
      },
    ])

    res.status(200).json({
      status: "success",
      data: {
        overview: {
          totalDrivers,
          activeDrivers,
          totalRoutes,
          activeRoutes,
          totalOrders,
          pendingOrders,
        },
        topDrivers,
        popularRoutes: routeUsage,
      },
    })
  } catch (error) {
    logger.error("Get system stats error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch system statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Helper function to get status colors
const getStatusColor = (status) => {
  const colors = {
    delivered: "#22c55e",
    late: "#ef4444",
    "in-progress": "#f59e0b",
    pending: "#6b7280",
    cancelled: "#dc2626",
  }
  return colors[status] || "#6b7280"
}

module.exports = {
  getDashboardKPIs,
  getChartData,
  getSystemStats,
}
