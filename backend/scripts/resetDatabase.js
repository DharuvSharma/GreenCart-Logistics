const mongoose = require("mongoose")
require("dotenv").config()

const User = require("../models/User")
const Driver = require("../models/Driver")
const Route = require("../models/Route")
const Order = require("../models/Order")
const logger = require("../utils/logger")

const resetDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info("Connected to MongoDB for reset")

    // Drop all collections
    await Promise.all([User.deleteMany({}), Driver.deleteMany({}), Route.deleteMany({}), Order.deleteMany({})])

    logger.info("Database reset completed successfully!")
    process.exit(0)
  } catch (error) {
    logger.error("Database reset failed:", error)
    process.exit(1)
  }
}

resetDatabase()
