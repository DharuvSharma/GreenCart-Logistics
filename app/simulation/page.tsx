"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Play, Clock, Users, Settings } from "lucide-react"

interface SimulationParams {
  numberOfDrivers: number
  startTime: string
  maxHoursPerDriver: number
}

interface SimulationResults {
  totalProfit: number
  efficiencyScore: number
  onTimeDeliveries: number
  lateDeliveries: number
  fuelCosts: number
  penalties: number
  bonuses: number
}

export default function SimulationPage() {
  const [params, setParams] = useState<SimulationParams>({
    numberOfDrivers: 5,
    startTime: "09:00",
    maxHoursPerDriver: 8,
  })
  const [results, setResults] = useState<SimulationResults | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: keyof SimulationParams, value: string | number) => {
    setParams((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const runSimulation = async () => {
    // Validate inputs
    if (params.numberOfDrivers < 1 || params.numberOfDrivers > 50) {
      toast({
        title: "Invalid Input",
        description: "Number of drivers must be between 1 and 50",
        variant: "destructive",
      })
      return
    }

    if (params.maxHoursPerDriver < 1 || params.maxHoursPerDriver > 12) {
      toast({
        title: "Invalid Input",
        description: "Max hours per driver must be between 1 and 12",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const simulationResults = await api.runSimulation(params)
      setResults(simulationResults as SimulationResults)

      toast({
        title: "Simulation Complete",
        description: "Delivery simulation has been successfully executed",
      })
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: "An error occurred while running the simulation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Delivery Simulation</h1>
        <p className="text-gray-600 mt-1">Configure parameters and run delivery operation simulations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Simulation Parameters
            </CardTitle>
            <CardDescription>Configure the simulation settings and run the delivery optimization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfDrivers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Drivers
              </Label>
              <Input
                id="numberOfDrivers"
                type="number"
                min="1"
                max="50"
                value={params.numberOfDrivers}
                onChange={(e) => handleInputChange("numberOfDrivers", Number.parseInt(e.target.value) || 1)}
                placeholder="Enter number of drivers"
              />
              <p className="text-xs text-gray-500">Available drivers for the simulation (1-50)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={params.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
              />
              <p className="text-xs text-gray-500">Delivery operations start time</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxHoursPerDriver" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Max Hours per Driver
              </Label>
              <Input
                id="maxHoursPerDriver"
                type="number"
                min="1"
                max="12"
                value={params.maxHoursPerDriver}
                onChange={(e) => handleInputChange("maxHoursPerDriver", Number.parseInt(e.target.value) || 8)}
                placeholder="Enter max hours"
              />
              <p className="text-xs text-gray-500">Maximum working hours per driver (1-12)</p>
            </div>

            <Button onClick={runSimulation} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Simulation Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Simulation Rules</CardTitle>
            <CardDescription>Business logic applied during simulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Late Delivery Penalty:</strong> ₹50 deducted if delivery exceeds base time + 10 minutes
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Driver Fatigue:</strong> 30% speed reduction if driver worked &gt;8h previous day
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>High-Value Bonus:</strong> 10% bonus for orders &gt;₹1000 delivered on time
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Fuel Cost:</strong> Base ₹5/km + ₹2/km extra for high traffic routes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulation Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">Simulation Results</h2>
            <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Latest Run</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Profit"
              value={`₹${results.totalProfit.toLocaleString()}`}
              description="Revenue minus all costs"
              trend="up"
              trendValue="Simulated"
            />
            <KpiCard
              title="Efficiency Score"
              value={`${results.efficiencyScore}%`}
              description="On-time delivery rate"
              trend={results.efficiencyScore >= 80 ? "up" : "down"}
              trendValue={results.efficiencyScore >= 80 ? "Good" : "Needs Improvement"}
            />
            <KpiCard
              title="On-time Deliveries"
              value={results.onTimeDeliveries.toString()}
              description="Delivered within time"
              trend="up"
              trendValue="Completed"
            />
            <KpiCard
              title="Late Deliveries"
              value={results.lateDeliveries.toString()}
              description="Delayed deliveries"
              trend="down"
              trendValue="Penalties Applied"
            />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Fuel Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">₹{results.fuelCosts?.toLocaleString() || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Total fuel expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Penalties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{results.penalties?.toLocaleString() || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Late delivery penalties</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Bonuses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{results.bonuses?.toLocaleString() || 0}</div>
                <p className="text-xs text-gray-500 mt-1">High-value order bonuses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
