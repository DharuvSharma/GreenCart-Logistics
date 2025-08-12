const express = require("express")
const { getDashboardKPIs, getChartData, getSystemStats } = require("../controllers/dashboardController")
const auth = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// Routes
router.get("/kpis", getDashboardKPIs)
router.get("/charts", getChartData)
router.get("/stats", getSystemStats)

module.exports = router
