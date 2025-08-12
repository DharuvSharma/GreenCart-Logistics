const mongoose = require("mongoose")

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
      minlength: [2, "Driver name must be at least 2 characters long"],
      maxlength: [50, "Driver name cannot exceed 50 characters"],
    },
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      trim: true,
    },
    currentShiftHours: {
      type: Number,
      default: 0,
      min: [0, "Current shift hours cannot be negative"],
      max: [24, "Current shift hours cannot exceed 24"],
    },
    past7DayHours: {
      type: Number,
      default: 0,
      min: [0, "Past 7-day hours cannot be negative"],
      max: [168, "Past 7-day hours cannot exceed 168 (7 days * 24 hours)"],
    },
    maxHoursPerDay: {
      type: Number,
      default: 8,
      min: [1, "Max hours per day must be at least 1"],
      max: [24, "Max hours per day cannot exceed 24"],
    },
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rate is required"],
      min: [0, "Hourly rate cannot be negative"],
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on-leave"],
      default: "active",
    },
    vehicleAssigned: {
      type: String,
      trim: true,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
      min: [0, "Total deliveries cannot be negative"],
    },
    rating: {
      type: Number,
      default: 5.0,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
  },
  {
    timestamps: true,
  },
)

// Calculate fatigue factor based on current shift hours
driverSchema.methods.getFatigueFactor = function () {
  if (this.currentShiftHours <= 4) return 1.0
  if (this.currentShiftHours <= 8) return 1.1
  if (this.currentShiftHours <= 12) return 1.3
  return 1.5
}

// Check if driver can work more hours
driverSchema.methods.canWorkMoreHours = function (additionalHours = 0) {
  return this.currentShiftHours + additionalHours <= this.maxHoursPerDay
}

// Reset shift hours (called daily)
driverSchema.methods.resetShiftHours = function () {
  this.currentShiftHours = 0
  return this.save()
}

module.exports = mongoose.model("Driver", driverSchema)
