const mongoose = require("mongoose")

const routeSchema = new mongoose.Schema(
  {
    routeId: {
      type: String,
      required: [true, "Route ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Route name is required"],
      trim: true,
      maxlength: [100, "Route name cannot exceed 100 characters"],
    },
    distance: {
      type: Number,
      required: [true, "Distance is required"],
      min: [0.1, "Distance must be at least 0.1 km"],
      max: [1000, "Distance cannot exceed 1000 km"],
    },
    trafficLevel: {
      type: String,
      required: [true, "Traffic level is required"],
      enum: {
        values: ["Low", "Medium", "High"],
        message: "Traffic level must be Low, Medium, or High",
      },
    },
    baseTime: {
      type: Number,
      required: [true, "Base time is required"],
      min: [1, "Base time must be at least 1 minute"],
      max: [1440, "Base time cannot exceed 1440 minutes (24 hours)"],
    },
    startLocation: {
      type: {
        address: {
          type: String,
          required: true,
          trim: true,
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: "2dsphere",
        },
      },
      required: [true, "Start location is required"],
    },
    endLocation: {
      type: {
        address: {
          type: String,
          required: true,
          trim: true,
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: "2dsphere",
        },
      },
      required: [true, "End location is required"],
    },
    fuelCostPerKm: {
      type: Number,
      default: 8.5, // Default fuel cost per km in Rs
      min: [0, "Fuel cost per km cannot be negative"],
    },
    tollCharges: {
      type: Number,
      default: 0,
      min: [0, "Toll charges cannot be negative"],
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageCompletionTime: {
      type: Number,
      default: function () {
        return this.baseTime
      },
    },
    totalCompletions: {
      type: Number,
      default: 0,
      min: [0, "Total completions cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
)

// Calculate total fuel cost for this route
routeSchema.methods.calculateFuelCost = function () {
  return this.distance * this.fuelCostPerKm + this.tollCharges
}

// Get traffic multiplier based on traffic level
routeSchema.methods.getTrafficMultiplier = function () {
  const multipliers = {
    Low: 1.0,
    Medium: 1.2,
    High: 1.5,
  }
  return multipliers[this.trafficLevel] || 1.0
}

// Calculate estimated completion time with traffic
routeSchema.methods.getEstimatedTime = function (driverFatigueFactor = 1.0) {
  return Math.round(this.baseTime * this.getTrafficMultiplier() * driverFatigueFactor)
}

// Update average completion time
routeSchema.methods.updateAverageTime = function (actualTime) {
  const totalTime = this.averageCompletionTime * this.totalCompletions + actualTime
  this.totalCompletions += 1
  this.averageCompletionTime = Math.round(totalTime / this.totalCompletions)
  return this.save()
}

module.exports = mongoose.model("Route", routeSchema)
