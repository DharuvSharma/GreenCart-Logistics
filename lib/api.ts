// API configuration and mock endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Enhanced mock data with more realistic data persistence simulation
// In-memory storage simulation (would be replaced with actual database in production)
const persistentData = {
  drivers: [
    { id: "1", name: "Rajesh Kumar", currentShiftHours: 6, past7DayHours: [8, 7, 8, 6, 9, 7, 8] },
    { id: "2", name: "Priya Sharma", currentShiftHours: 4, past7DayHours: [7, 8, 6, 8, 7, 9, 6] },
    { id: "3", name: "Amit Singh", currentShiftHours: 8, past7DayHours: [9, 8, 7, 8, 6, 8, 7] },
    { id: "4", name: "Sunita Devi", currentShiftHours: 5, past7DayHours: [6, 8, 7, 9, 6, 8, 7] },
    { id: "5", name: "Vikram Yadav", currentShiftHours: 7, past7DayHours: [8, 9, 6, 7, 8, 6, 9] },
  ],
  routes: [
    { id: "R001", routeId: "Route A", distanceKm: 25, trafficLevel: "Medium", baseTimeMinutes: 45 },
    { id: "R002", routeId: "Route B", distanceKm: 18, trafficLevel: "Low", baseTimeMinutes: 30 },
    { id: "R003", routeId: "Route C", distanceKm: 35, trafficLevel: "High", baseTimeMinutes: 60 },
    { id: "R004", routeId: "Route D", distanceKm: 22, trafficLevel: "Medium", baseTimeMinutes: 40 },
    { id: "R005", routeId: "Route E", distanceKm: 28, trafficLevel: "Low", baseTimeMinutes: 35 },
  ],
  orders: [
    { id: "O001", orderId: "ORD-001", value_rs: 1250, routeId: "R001", deliveryTimestamp: "2024-01-15T10:30:00Z" },
    { id: "O002", orderId: "ORD-002", value_rs: 850, routeId: "R002", deliveryTimestamp: "2024-01-15T14:15:00Z" },
    { id: "O003", orderId: "ORD-003", value_rs: 2100, routeId: "R003", deliveryTimestamp: "2024-01-15T16:45:00Z" },
    { id: "O004", orderId: "ORD-004", value_rs: 1800, routeId: "R004", deliveryTimestamp: "2024-01-16T09:00:00Z" },
    { id: "O005", orderId: "ORD-005", value_rs: 950, routeId: "R005", deliveryTimestamp: "2024-01-16T11:30:00Z" },
    { id: "O006", orderId: "ORD-006", value_rs: 1450, routeId: "R001", deliveryTimestamp: "2024-01-16T13:15:00Z" },
  ],
  simulationHistory: [] as any[],
}

// Added error handling utilities and response types
interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

interface ApiError {
  message: string
  status: number
  details?: any
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  // Enhanced error handling with proper HTTP status codes
  private async handleResponse<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(error.message, 500)
      }
      throw new ApiError("Unknown error occurred", 500)
    }
  }

  private simulateNetworkDelay(min = 100, max = 300): Promise<void> {
    const delay = Math.random() * (max - min) + min
    return new Promise((resolve) => setTimeout(resolve, delay))
  }

  // Enhanced authentication with proper JWT simulation
  async login(credentials: { username: string; password: string }): Promise<{ token: string; user: any }> {
    await this.simulateNetworkDelay(800, 1500)

    const validCredentials = [
      { username: "admin", password: "admin123", role: "manager" },
      { username: "manager", password: "manager123", role: "manager" },
      { username: "supervisor", password: "super123", role: "supervisor" },
    ]

    const user = validCredentials.find(
      (cred) => cred.username === credentials.username && cred.password === credentials.password,
    )

    if (!user) {
      throw new ApiError("Invalid username or password", 401)
    }

    const token = `jwt-${user.username}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return {
      token,
      user: { username: user.username, role: user.role },
    }
  }

  // Enhanced KPI calculation with real-time data
  async getLatestKPIs(): Promise<any> {
    await this.simulateNetworkDelay()

    const orders = persistentData.orders
    const drivers = persistentData.drivers

    // Calculate real KPIs based on current data
    const totalOrderValue = orders.reduce((sum, order) => sum + order.value_rs, 0)
    const avgOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0

    // Simulate delivery status based on order timing and routes
    const now = new Date()
    const onTimeDeliveries = Math.floor(orders.length * 0.85) // 85% on-time rate
    const lateDeliveries = orders.length - onTimeDeliveries

    // Calculate estimated costs
    const routes = persistentData.routes
    const avgDistance = routes.reduce((sum, route) => sum + route.distanceKm, 0) / routes.length
    const estimatedFuelCosts = orders.length * avgDistance * 6 // ₹6 per km average
    const penalties = lateDeliveries * 50
    const bonuses = Math.floor(onTimeDeliveries * 0.6) * avgOrderValue * 0.1 // High-value bonus

    const totalProfit = totalOrderValue + bonuses - penalties - estimatedFuelCosts
    const efficiencyScore = Math.round((onTimeDeliveries / orders.length) * 100)

    return {
      totalProfit: Math.floor(totalProfit),
      efficiencyScore,
      onTimeDeliveries,
      lateDeliveries,
    }
  }

  async getChartData(): Promise<any> {
    await this.simulateNetworkDelay()

    const orders = persistentData.orders
    const routes = persistentData.routes

    // Calculate delivery status directly without calling getLatestKPIs again
    const onTimeDeliveries = Math.floor(orders.length * 0.85)
    const lateDeliveries = orders.length - onTimeDeliveries

    return {
      deliveryStatus: [
        { name: "On Time", value: onTimeDeliveries, color: "#10b981" },
        { name: "Late", value: lateDeliveries, color: "#ef4444" },
      ],
      fuelCosts: routes.map((route) => ({
        route: route.routeId,
        cost: Math.floor(
          route.distanceKm * (route.trafficLevel === "High" ? 7 : route.trafficLevel === "Medium" ? 6 : 5) * 20,
        ),
      })),
    }
  }

  // Enhanced simulation with comprehensive business logic and history tracking
  async runSimulation(params: { numberOfDrivers: number; startTime: string; maxHoursPerDriver: number }): Promise<any> {
    await this.simulateNetworkDelay(1500, 3000)

    // Validate input parameters
    if (params.numberOfDrivers < 1 || params.numberOfDrivers > 50) {
      throw new ApiError("Number of drivers must be between 1 and 50", 400)
    }

    if (params.maxHoursPerDriver < 1 || params.maxHoursPerDriver > 12) {
      throw new ApiError("Max hours per driver must be between 1 and 12", 400)
    }

    // Enhanced simulation logic
    const baseOrders = Math.floor(params.numberOfDrivers * params.maxHoursPerDriver * 1.8)
    const totalOrders = Math.max(baseOrders, 15)

    // Driver fatigue calculation
    const fatigueReduction = params.maxHoursPerDriver > 8 ? 0.7 : 1.0
    const effectiveCapacity = params.numberOfDrivers * params.maxHoursPerDriver * fatigueReduction

    // Traffic and time-based efficiency
    const startHour = Number.parseInt(params.startTime.split(":")[0])
    const rushHourPenalty = (startHour >= 7 && startHour <= 9) || (startHour >= 17 && startHour <= 19) ? 0.85 : 1.0

    const onTimeRate = Math.min(0.95, (effectiveCapacity / totalOrders) * rushHourPenalty)
    const onTimeDeliveries = Math.floor(totalOrders * onTimeRate)
    const lateDeliveries = totalOrders - onTimeDeliveries

    // Enhanced cost calculations
    const avgOrderValue = 1200 + Math.random() * 800 // ₹1200-2000 range
    const totalRevenue = Math.floor(totalOrders * avgOrderValue)

    // High-value bonus calculation
    const highValueThreshold = 1000
    const highValueOrders = Math.floor(onTimeDeliveries * 0.65)
    const bonuses = Math.floor(highValueOrders * avgOrderValue * 0.1)

    // Penalty calculations
    const penalties = lateDeliveries * 50

    // Fuel cost calculations with traffic consideration
    const avgDistance = 25
    const routes = persistentData.routes
    const highTrafficRoutes = routes.filter((r) => r.trafficLevel === "High").length / routes.length
    const baseFuelCost = totalOrders * avgDistance * 5
    const extraFuelCost = Math.floor(totalOrders * avgDistance * highTrafficRoutes * 2)
    const fuelCosts = baseFuelCost + extraFuelCost

    const totalProfit = totalRevenue + bonuses - penalties - fuelCosts
    const efficiencyScore = Math.round(onTimeRate * 100)

    const results = {
      totalProfit: Math.max(0, totalProfit),
      efficiencyScore,
      onTimeDeliveries,
      lateDeliveries,
      fuelCosts,
      penalties,
      bonuses,
      totalRevenue,
      totalOrders,
      simulationParams: params,
      timestamp: new Date().toISOString(),
    }

    // Store simulation in history
    persistentData.simulationHistory.unshift(results)
    if (persistentData.simulationHistory.length > 10) {
      persistentData.simulationHistory = persistentData.simulationHistory.slice(0, 10)
    }

    return results
  }

  // Enhanced CRUD operations with proper data persistence
  async getDrivers(): Promise<any[]> {
    await this.simulateNetworkDelay()
    return [...persistentData.drivers]
  }

  async createDriver(driver: any): Promise<any> {
    await this.simulateNetworkDelay(400, 800)

    if (!driver.name || driver.name.trim().length < 2) {
      throw new ApiError("Driver name must be at least 2 characters long", 400)
    }

    const newDriver = {
      ...driver,
      id: `D${Date.now()}`,
      currentShiftHours: driver.currentShiftHours || 0,
      past7DayHours: driver.past7DayHours || [0, 0, 0, 0, 0, 0, 0],
    }

    persistentData.drivers.push(newDriver)
    return newDriver
  }

  async updateDriver(id: string, driver: any): Promise<any> {
    await this.simulateNetworkDelay(400, 800)

    const index = persistentData.drivers.findIndex((d) => d.id === id)
    if (index === -1) {
      throw new ApiError("Driver not found", 404)
    }

    const updatedDriver = { ...persistentData.drivers[index], ...driver, id }
    persistentData.drivers[index] = updatedDriver
    return updatedDriver
  }

  async deleteDriver(id: string): Promise<{ success: boolean }> {
    await this.simulateNetworkDelay(300, 600)

    const index = persistentData.drivers.findIndex((d) => d.id === id)
    if (index === -1) {
      throw new ApiError("Driver not found", 404)
    }

    persistentData.drivers.splice(index, 1)
    return { success: true }
  }

  async getRoutes(): Promise<any[]> {
    await this.simulateNetworkDelay()
    return [...persistentData.routes]
  }

  async createRoute(route: any): Promise<any> {
    await this.simulateNetworkDelay(400, 800)

    if (!route.routeId || route.routeId.trim().length < 1) {
      throw new ApiError("Route ID is required", 400)
    }

    if (route.distanceKm <= 0 || route.baseTimeMinutes <= 0) {
      throw new ApiError("Distance and base time must be positive numbers", 400)
    }

    const newRoute = {
      ...route,
      id: `R${Date.now()}`,
    }

    persistentData.routes.push(newRoute)
    return newRoute
  }

  async updateRoute(id: string, route: any): Promise<any> {
    await this.simulateNetworkDelay(400, 800)

    const index = persistentData.routes.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new ApiError("Route not found", 404)
    }

    const updatedRoute = { ...persistentData.routes[index], ...route, id }
    persistentData.routes[index] = updatedRoute
    return updatedRoute
  }

  async deleteRoute(id: string): Promise<{ success: boolean }> {
    await this.simulateNetworkDelay(300, 600)

    const index = persistentData.routes.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new ApiError("Route not found", 404)
    }

    persistentData.routes.splice(index, 1)
    return { success: true }
  }

  async getOrders(): Promise<any[]> {
    await this.simulateNetworkDelay()
    return [...persistentData.orders]
  }

  async createOrder(order: any): Promise<any> {
    await this.simulateNetworkDelay(400, 800)

    if (!order.orderId || order.orderId.trim().length < 1) {
      throw new ApiError("Order ID is required", 400)
    }

    if (order.value_rs <= 0) {
      throw new ApiError("Order value must be a positive number", 400)
    }

    const newOrder = {
      ...order,
      id: `O${Date.now()}`,
    }

    persistentData.orders.push(newOrder)
    return newOrder
  }

  async updateOrder(id: string, order: any): Promise<any> {
    await this.simulateNetworkDelay(400, 800)

    const index = persistentData.orders.findIndex((o) => o.id === id)
    if (index === -1) {
      throw new ApiError("Order not found", 404)
    }

    const updatedOrder = { ...persistentData.orders[index], ...order, id }
    persistentData.orders[index] = updatedOrder
    return updatedOrder
  }

  async deleteOrder(id: string): Promise<{ success: boolean }> {
    await this.simulateNetworkDelay(300, 600)

    const index = persistentData.orders.findIndex((o) => o.id === id)
    if (index === -1) {
      throw new ApiError("Order not found", 404)
    }

    persistentData.orders.splice(index, 1)
    return { success: true }
  }

  // Added simulation history endpoint
  async getSimulationHistory(): Promise<any[]> {
    await this.simulateNetworkDelay()
    return [...persistentData.simulationHistory]
  }
}

// Export enhanced API client with error handling
class ApiError extends Error {
  status: number
  details?: any

  constructor(message: string, status: number, details?: any) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

const apiClient = new ApiClient(API_BASE_URL)

// Enhanced API object with comprehensive error handling
export const api = {
  // Authentication
  login: (credentials: { username: string; password: string }) => apiClient.login(credentials),

  // Dashboard and KPIs
  getLatestKPIs: () => apiClient.getLatestKPIs(),
  getChartData: () => apiClient.getChartData(),

  // Simulation
  runSimulation: (params: { numberOfDrivers: number; startTime: string; maxHoursPerDriver: number }) =>
    apiClient.runSimulation(params),
  getSimulationHistory: () => apiClient.getSimulationHistory(),

  // Drivers CRUD
  getDrivers: () => apiClient.getDrivers(),
  createDriver: (driver: any) => apiClient.createDriver(driver),
  updateDriver: (id: string, driver: any) => apiClient.updateDriver(id, driver),
  deleteDriver: (id: string) => apiClient.deleteDriver(id),

  // Routes CRUD
  getRoutes: () => apiClient.getRoutes(),
  createRoute: (route: any) => apiClient.createRoute(route),
  updateRoute: (id: string, route: any) => apiClient.updateRoute(id, route),
  deleteRoute: (id: string) => apiClient.deleteRoute(id),

  // Orders CRUD
  getOrders: () => apiClient.getOrders(),
  createOrder: (order: any) => apiClient.createOrder(order),
  updateOrder: (id: string, order: any) => apiClient.updateOrder(id, order),
  deleteOrder: (id: string) => apiClient.deleteOrder(id),
}

// Export types and utilities for better TypeScript support
export type { ApiResponse, ApiError }
export { ApiClient }

// Export mock data for testing purposes
export const mockData = persistentData
