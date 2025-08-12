const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const User = require("../models/User")
const Driver = require("../models/Driver")
const Route = require("../models/Route")
const Order = require("../models/Order")
const logger = require("../utils/logger")

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info("Connected to MongoDB for seeding")

    // Clear existing data
    await Promise.all([User.deleteMany({}), Driver.deleteMany({}), Route.deleteMany({}), Order.deleteMany({})])

    // Create admin user
    const adminUser = await User.create({
      username: "admin",
      email: "admin@greencart.com",
      password: "admin123",
      role: "admin",
    })

    // Create sample drivers
    const drivers = await Driver.create([
      {
        name: "Rajesh Kumar",
        employeeId: "EMP001",
        currentShiftHours: 4,
        past7DayHours: 35,
        hourlyRate: 150,
        licenseNumber: "DL001234567890",
        phoneNumber: "+91-9876543210",
        vehicleAssigned: "MH-01-AB-1234",
        totalDeliveries: 245,
        rating: 4.8,
      },
      {
        name: "Priya Sharma",
        employeeId: "EMP002",
        currentShiftHours: 2,
        past7DayHours: 28,
        hourlyRate: 160,
        licenseNumber: "DL001234567891",
        phoneNumber: "+91-9876543211",
        vehicleAssigned: "MH-01-CD-5678",
        totalDeliveries: 189,
        rating: 4.9,
      },
      {
        name: "Amit Patel",
        employeeId: "EMP003",
        currentShiftHours: 6,
        past7DayHours: 42,
        hourlyRate: 140,
        licenseNumber: "DL001234567892",
        phoneNumber: "+91-9876543212",
        vehicleAssigned: "MH-01-EF-9012",
        totalDeliveries: 312,
        rating: 4.7,
      },
    ])

    // Create sample routes
    const routes = await Route.create([
      {
        routeId: "RT001",
        name: "Mumbai Central to Andheri",
        distance: 15.5,
        trafficLevel: "High",
        baseTime: 45,
        startLocation: {
          address: "Mumbai Central, Mumbai, Maharashtra",
          coordinates: [72.8205, 19.0176],
        },
        endLocation: {
          address: "Andheri West, Mumbai, Maharashtra",
          coordinates: [72.8397, 19.1136],
        },
        fuelCostPerKm: 8.5,
        tollCharges: 25,
        difficulty: "Hard",
        totalCompletions: 156,
        averageCompletionTime: 52,
      },
      {
        routeId: "RT002",
        name: "Bandra to Powai",
        distance: 12.3,
        trafficLevel: "Medium",
        baseTime: 35,
        startLocation: {
          address: "Bandra West, Mumbai, Maharashtra",
          coordinates: [72.8265, 19.0596],
        },
        endLocation: {
          address: "Powai, Mumbai, Maharashtra",
          coordinates: [72.9081, 19.1197],
        },
        fuelCostPerKm: 8.5,
        tollCharges: 0,
        difficulty: "Medium",
        totalCompletions: 203,
        averageCompletionTime: 38,
      },
      {
        routeId: "RT003",
        name: "Thane to Navi Mumbai",
        distance: 22.8,
        trafficLevel: "Low",
        baseTime: 55,
        startLocation: {
          address: "Thane West, Thane, Maharashtra",
          coordinates: [72.9781, 19.2183],
        },
        endLocation: {
          address: "Vashi, Navi Mumbai, Maharashtra",
          coordinates: [73.0169, 19.0728],
        },
        fuelCostPerKm: 8.5,
        tollCharges: 40,
        difficulty: "Easy",
        totalCompletions: 89,
        averageCompletionTime: 58,
      },
    ])

    // Create sample orders
    const orders = await Order.create([
      {
        orderId: "ORD001",
        valueRs: 15000,
        assignedRoute: routes[0]._id,
        assignedDriver: drivers[0]._id,
        customerInfo: {
          name: "Suresh Mehta",
          phone: "+91-9123456789",
          address: "A-101, Sunrise Apartments, Andheri West, Mumbai",
        },
        scheduledDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: "assigned",
        priority: "high",
        deliveryInstructions: "Call before delivery. Building has security.",
      },
      {
        orderId: "ORD002",
        valueRs: 8500,
        assignedRoute: routes[1]._id,
        assignedDriver: drivers[1]._id,
        customerInfo: {
          name: "Neha Singh",
          phone: "+91-9123456790",
          address: "B-205, Green Valley, Powai, Mumbai",
        },
        scheduledDeliveryTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        status: "in-progress",
        priority: "medium",
        deliveryInstructions: "Fragile items. Handle with care.",
      },
      {
        orderId: "ORD003",
        valueRs: 25000,
        assignedRoute: routes[2]._id,
        customerInfo: {
          name: "Vikram Joshi",
          phone: "+91-9123456791",
          address: "C-301, Ocean View, Vashi, Navi Mumbai",
        },
        scheduledDeliveryTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        status: "pending",
        priority: "urgent",
        deliveryInstructions: "High-value electronics. Signature required.",
      },
    ])

    logger.info("Database seeded successfully!")
    logger.info(`Created ${drivers.length} drivers, ${routes.length} routes, ${orders.length} orders`)

    process.exit(0)
  } catch (error) {
    logger.error("Seeding failed:", error)
    process.exit(1)
  }
}

seedData()
