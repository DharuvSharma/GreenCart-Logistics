"use client"

import { useState, useEffect } from "react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { ChartCard } from "@/components/dashboard/chart-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { api } from "@/lib/api"
import { handleApiError } from "@/lib/error-handler"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"

interface KPIData {
  totalProfit: number
  efficiencyScore: number
  onTimeDeliveries: number
  lateDeliveries: number
}

interface ChartData {
  deliveryStatus: Array<{ name: string; value: number; color: string }>
  fuelCosts: Array<{ route: string; cost: number }>
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { toast } = useToast()

  const fetchDashboardData = async () => {
    try {
      const [kpiData, chartsData] = await Promise.all([api.getLatestKPIs(), api.getChartData()])

      setKpis(kpiData as KPIData)
      setChartData(chartsData as ChartData)
    } catch (error) {
      const errorInfo = handleApiError(error, "Failed to fetch dashboard data")
      toast(errorInfo)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
  }

  useEffect(() => {
    fetchDashboardData()

    let intervalId: NodeJS.Timeout | null = null

    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchDashboardData()
      }, 30000) // Auto-refresh every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [autoRefresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor your delivery operations and KPIs</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="auto-refresh" className="text-sm text-gray-600">
                Auto-refresh
              </label>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="bg-white hover:bg-gray-50 shadow-sm transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <KpiCard
            title="Total Profit"
            value={`₹${kpis?.totalProfit?.toLocaleString() || 0}`}
            description="Revenue minus costs"
            trend="up"
            trendValue="12%"
            icon={<TrendingUp className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow duration-200"
          />
          <KpiCard
            title="Efficiency Score"
            value={`${kpis?.efficiencyScore || 0}%`}
            description="On-time delivery rate"
            trend="up"
            trendValue="5%"
            icon={<Clock className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow duration-200"
          />
          <KpiCard
            title="On-time Deliveries"
            value={kpis?.onTimeDeliveries?.toString() || "0"}
            description="Delivered within time"
            trend="up"
            trendValue="8"
            icon={<CheckCircle className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow duration-200"
          />
          <KpiCard
            title="Late Deliveries"
            value={kpis?.lateDeliveries?.toString() || "0"}
            description="Delayed deliveries"
            trend="down"
            trendValue="3"
            icon={<XCircle className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow duration-200"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard
            title="Delivery Status"
            description="Distribution of on-time vs late deliveries"
            type="pie"
            data={chartData?.deliveryStatus || []}
            className="hover:shadow-md transition-shadow duration-200"
          />
          <ChartCard
            title="Fuel Cost Breakdown"
            description="Fuel costs by route"
            type="bar"
            data={chartData?.fuelCosts || []}
            className="hover:shadow-md transition-shadow duration-200"
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}
