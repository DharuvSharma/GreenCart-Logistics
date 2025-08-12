const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    valueRs: {
      type: Number,
      required: [true, "Order value is required"],
      min: [1, "Order value must be at least Rs. 1"],
      max: [1000000, "Order value cannot exceed Rs. 10,00,000"],
    },
    assignedRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: [true, "Assigned route is required"],
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    customerInfo: {
      name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
        maxlength: [100, "Customer name cannot exceed 100 characters"],
      },
      phone: {
        type: String,
        required: [true, "Customer phone is required"],
        match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
      },
      address: {
        type: String,
        required: [true, "Customer address is required"],
        trim: true,
        maxlength: [200, "Customer address cannot exceed 200 characters"],
      },
    },
    deliveryTimestamp: {
      type: Date,
      default: null,
    },
    scheduledDeliveryTime: {
      type: Date,
      required: [true, "Scheduled delivery time is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "assigned", "in-progress", "delivered", "late", "cancelled"],
        message: "Status must be one of: pending, assigned, in-progress, delivered, late, cancelled",
      },
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: [500, "Delivery instructions cannot exceed 500 characters"],
    },
    actualDeliveryTime: {
      type: Number, // Time taken in minutes
      default: null,
    },
    isHighValue: {
      type: Boolean,
      default: function () {
        return this.valueRs >= 10000
      },
    },
    deliveryAttempts: {
      type: Number,
      default: 0,
      min: [0, "Delivery attempts cannot be negative"],
    },
    feedback: {
      rating: {
        type: Number,
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"],
      },
      comment: {
        type: String,
        trim: true,
        maxlength: [500, "Feedback comment cannot exceed 500 characters"],
      },
    },
  },
  {
    timestamps: true,
  },
)

// Check if order is late
orderSchema.methods.isLate = function () {
  if (!this.deliveryTimestamp || !this.scheduledDeliveryTime) return false
  return this.deliveryTimestamp > this.scheduledDeliveryTime
}

// Calculate delivery bonus/penalty
orderSchema.methods.calculateDeliveryBonus = function () {
  let bonus = 0

  // High-value order bonus
  if (this.isHighValue) {
    bonus += this.valueRs * 0.02 // 2% of order value
  }

  // On-time delivery bonus
  if (this.status === "delivered" && !this.isLate()) {
    bonus += 100 // Rs. 100 on-time bonus
  }

  // Late delivery penalty
  if (this.status === "delivered" && this.isLate()) {
    const hoursLate = Math.ceil((this.deliveryTimestamp - this.scheduledDeliveryTime) / (1000 * 60 * 60))
    bonus -= hoursLate * 50 // Rs. 50 penalty per hour late
  }

  return Math.max(bonus, -500) // Maximum penalty of Rs. 500
}

// Mark as delivered
orderSchema.methods.markAsDelivered = function (actualTimeMinutes) {
  this.status = "delivered"
  this.deliveryTimestamp = new Date()
  this.actualDeliveryTime = actualTimeMinutes
  return this.save()
}

// Populate references by default
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "assignedRoute",
    select: "routeId name distance trafficLevel baseTime",
  }).populate({
    path: "assignedDriver",
    select: "name employeeId currentShiftHours rating",
  })
  next()
})

module.exports = mongoose.model("Order", orderSchema)
