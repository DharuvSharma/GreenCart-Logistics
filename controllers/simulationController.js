const Driver = require("../models/Driver")
const Route = require("../models/Route")
const Order = require("../models/Order")
const logger = require("../utils/logger")

// Simulation state management
let simulationInProgress = false
let simulationResults = null

// @desc    Run delivery simulation
// @route   POST /api/simulation/run
// @access  Private (Manager/Admin)
const runSimulation = async (req, res) => {
  try {
    const { numberOfDrivers, startTime, maxHoursPerDriver } = req.body

    // Validate input
    if (!numberOfDrivers || numberOfDrivers < 1 || numberOfDrivers > 50) {
      return res.status(400).json({
        status: "error",
        message: "Number of drivers must be between 1 and 50",
      })
    }

    if (!maxHoursPerDriver || maxHoursPerDriver < 1 || maxHoursPerDriver > 24) {
      return res.status(400).json({
        status: "error",
        message: "Max hours per driver must be between 1 and 24",
      })
    }

    // Check if simulation is already running
    if (simulationInProgress) {
      return res.status(409).json({
        status: "error",
        message: "Simulation is already in progress. Please wait for it to complete.",
      })
    }

    simulationInProgress = true

    // Get available drivers and pending orders
    const availableDrivers = await Driver.find({ status: "active" })
      .sort({ currentShiftHours: 1, rating: -1 })
      .limit(numberOfDrivers)

    const pendingOrders = await Order.find({ status: "pending" }).populate("assignedRoute")

    if (availableDrivers.length === 0) {
      simulationInProgress = false
      return res.status(400).json({
        status: "error",
        message: "No active drivers available for simulation",
      })
    }

    if (pendingOrders.length === 0) {
      simulationInProgress = false
      return res.status(400).json({
        status: "error",
        message: "No pending orders available for simulation",
      })
    }

    // Run the simulation
    const results = await performDeliverySimulation(availableDrivers, pendingOrders, maxHoursPerDriver, startTime)

    simulationResults = {
      ...results,
      timestamp: new Date(),
      parameters: { numberOfDrivers, startTime, maxHoursPerDriver },
    }

    simulationInProgress = false

    logger.info(`Simulation completed with ${results.totalOrders} orders and ${results.driversUsed} drivers`)

    res.status(200).json({
      status: "success",
      message: "Simulation completed successfully",
      data: simulationResults,
    })
  } catch (error) {
    simulationInProgress = false
    logger.error("Simulation error:", error)
    res.status(500).json({
      status: "error",
      message: "Simulation failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// @desc    Get simulation status
// @route   GET /api/simulation/status
// @access  Private
const getSimulationStatus = async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        inProgress: simulationInProgress,
        lastResults: simulationResults,
      },
    })
  } catch (error) {
    logger.error("Get simulation status error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to get simulation status",
    })
  }
}

// Core simulation logic
const performDeliverySimulation = async (drivers, orders, maxHoursPerDriver, startTime) => {
  const simulationStartTime = new Date(startTime || Date.now())
  const results = {
    totalProfit: 0,
    totalFuelCost: 0,
    totalOrders: 0,
    onTimeDeliveries: 0,
    lateDeliveries: 0,
    driversUsed: 0,
    efficiencyScore: 0,
    driverPerformance: [],
    orderResults: [],
    optimizationDetails: {
      totalDistance: 0,
      totalTime: 0,
      averageUtilization: 0,
    },
  }

  // Initialize driver states
  const driverStates = drivers.map((driver) => ({
    driver: driver,
    currentHours: driver.currentShiftHours,
    assignedOrders: [],
    totalEarnings: 0,
    totalDistance: 0,
    currentTime: new Date(simulationStartTime),
  }))

  // Sort orders by priority and value (high-value orders first)
  const sortedOrders = orders.sort((a, b) => {
    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }
    const aPriority = priorityWeight[a.priority] || 2
    const bPriority = priorityWeight[b.priority] || 2

    if (aPriority !== bPriority) return bPriority - aPriority
    return b.valueRs - a.valueRs // Higher value orders first
  })

  // Assign orders to drivers using optimization algorithm
  for (const order of sortedOrders) {
    const bestDriver = findOptimalDriver(driverStates, order, maxHoursPerDriver)

    if (bestDriver) {
      const deliveryResult = await simulateDelivery(bestDriver, order, simulationStartTime)
      bestDriver.assignedOrders.push(deliveryResult)
      bestDriver.totalEarnings += deliveryResult.earnings
      bestDriver.totalDistance += deliveryResult.distance
      bestDriver.currentHours += deliveryResult.timeSpent / 60 // Convert minutes to hours
      bestDriver.currentTime = new Date(bestDriver.currentTime.getTime() + deliveryResult.timeSpent * 60 * 1000)

      // Update results
      results.totalOrders++
      results.totalProfit += deliveryResult.profit
      results.totalFuelCost += deliveryResult.fuelCost

      if (deliveryResult.isOnTime) {
        results.onTimeDeliveries++
      } else {
        results.lateDeliveries++
      }

      results.orderResults.push(deliveryResult)
      results.optimizationDetails.totalDistance += deliveryResult.distance
      results.optimizationDetails.totalTime += deliveryResult.timeSpent
    }
  }

  // Calculate driver performance and final metrics
  results.driversUsed = driverStates.filter((ds) => ds.assignedOrders.length > 0).length

  for (const driverState of driverStates) {
    if (driverState.assignedOrders.length > 0) {
      const performance = {
        driverId: driverState.driver._id,
        driverName: driverState.driver.name,
        ordersCompleted: driverState.assignedOrders.length,
        totalEarnings: Math.round(driverState.totalEarnings),
        totalDistance: Math.round(driverState.totalDistance * 100) / 100,
        hoursWorked: Math.round(driverState.currentHours * 100) / 100,
        efficiency: calculateDriverEfficiency(driverState),
        onTimeRate:
          (driverState.assignedOrders.filter((o) => o.isOnTime).length / driverState.assignedOrders.length) * 100,
      }
      results.driverPerformance.push(performance)
    }
  }

  // Calculate overall efficiency score
  const totalPossibleOrders = orders.length
  const completionRate = (results.totalOrders / totalPossibleOrders) * 100
  const onTimeRate = results.totalOrders > 0 ? (results.onTimeDeliveries / results.totalOrders) * 100 : 0
  const utilizationRate =
    results.driversUsed > 0
      ? (results.optimizationDetails.totalTime / (results.driversUsed * maxHoursPerDriver * 60)) * 100
      : 0

  results.efficiencyScore = Math.round((completionRate * 0.4 + onTimeRate * 0.4 + utilizationRate * 0.2) * 100) / 100
  results.optimizationDetails.averageUtilization = Math.round(utilizationRate * 100) / 100

  // Round final numbers
  results.totalProfit = Math.round(results.totalProfit)
  results.totalFuelCost = Math.round(results.totalFuelCost)

  return results
}

// Find optimal driver for an order
const findOptimalDriver = (driverStates, order, maxHoursPerDriver) => {
  let bestDriver = null
  let bestScore = -1

  for (const driverState of driverStates) {
    // Check if driver can take more hours
    const route = order.assignedRoute
    if (!route) continue

    const estimatedTime = route.getEstimatedTime(driverState.driver.getFatigueFactor()) / 60 // Convert to hours
    if (driverState.currentHours + estimatedTime > maxHoursPerDriver) continue

    // Calculate driver score based on multiple factors
    const score = calculateDriverScore(driverState, order, route)

    if (score > bestScore) {
      bestScore = score
      bestDriver = driverState
    }
  }

  return bestDriver
}

// Calculate driver suitability score for an order
const calculateDriverScore = (driverState, order, route) => {
  const driver = driverState.driver
  let score = 0

  // Base score from driver rating
  score += driver.rating * 20

  // Penalty for fatigue
  const fatigueFactor = driver.getFatigueFactor()
  score -= (fatigueFactor - 1) * 30

  // Bonus for less current workload
  score += (8 - driverState.currentHours) * 5

  // Bonus for route familiarity (simplified - based on total completions)
  score += Math.min(route.totalCompletions * 0.1, 10)

  // Penalty for high-value orders if driver rating is low
  if (order.isHighValue && driver.rating < 4.5) {
    score -= 20
  }

  return score
}

// Simulate individual delivery
const simulateDelivery = async (driverState, order, simulationStartTime) => {
  const driver = driverState.driver
  const route = order.assignedRoute

  // Calculate delivery time with fatigue and traffic
  const fatigueFactor = driver.getFatigueFactor()
  const baseTime = route.baseTime
  const trafficMultiplier = route.getTrafficMultiplier()
  const actualTime = Math.round(baseTime * trafficMultiplier * fatigueFactor)

  // Calculate costs and earnings
  const fuelCost = route.calculateFuelCost()
  const driverEarnings = (actualTime / 60) * driver.hourlyRate
  const deliveryBonus = order.calculateDeliveryBonus()

  // Determine if delivery is on time (simplified)
  const scheduledTime = new Date(order.scheduledDeliveryTime)
  const deliveryTime = new Date(driverState.currentTime.getTime() + actualTime * 60 * 1000)
  const isOnTime = deliveryTime <= scheduledTime

  // Calculate profit
  const revenue = order.valueRs * 0.1 // 10% commission
  const totalCosts = fuelCost + driverEarnings
  const profit = revenue - totalCosts + deliveryBonus

  return {
    orderId: order.orderId,
    driverId: driver._id,
    driverName: driver.name,
    routeId: route.routeId,
    distance: route.distance,
    timeSpent: actualTime,
    fuelCost: Math.round(fuelCost),
    driverEarnings: Math.round(driverEarnings),
    deliveryBonus: Math.round(deliveryBonus),
    profit: Math.round(profit),
    isOnTime,
    scheduledTime,
    actualDeliveryTime: deliveryTime,
    fatigueFactor: Math.round(fatigueFactor * 100) / 100,
    trafficMultiplier: Math.round(trafficMultiplier * 100) / 100,
  }
}

// Calculate driver efficiency
const calculateDriverEfficiency = (driverState) => {
  if (driverState.assignedOrders.length === 0) return 0

  const totalRevenue = driverState.assignedOrders.reduce((sum, order) => sum + order.profit, 0)
  const totalTime = driverState.currentHours
  const efficiency = totalTime > 0 ? totalRevenue / totalTime : 0

  return Math.round(efficiency * 100) / 100
}

module.exports = {
  runSimulation,
  getSimulationStatus,
}
