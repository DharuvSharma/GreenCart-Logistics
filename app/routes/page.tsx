"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RouteModal } from "@/components/modals/route-modal"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Route } from "lucide-react"

interface RouteData {
  id: string
  routeId: string
  distanceKm: number
  trafficLevel: string
  baseTimeMinutes: number
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null)
  const { toast } = useToast()

  const fetchRoutes = async () => {
    try {
      const data = await api.getRoutes()
      setRoutes(data as RouteData[])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch routes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoute = () => {
    setEditingRoute(null)
    setModalOpen(true)
  }

  const handleEditRoute = (route: RouteData) => {
    setEditingRoute(route)
    setModalOpen(true)
  }

  const handleDeleteRoute = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return

    try {
      // Mock delete - replace with actual API call
      setRoutes(routes.filter((r) => r.id !== id))
      toast({
        title: "Success",
        description: "Route deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete route",
        variant: "destructive",
      })
    }
  }

  const handleSaveRoute = async (routeData: Omit<RouteData, "id">) => {
    try {
      if (editingRoute) {
        const updated = { ...routeData, id: editingRoute.id }
        setRoutes(routes.map((r) => (r.id === editingRoute.id ? updated : r)))
        toast({
          title: "Success",
          description: "Route updated successfully",
        })
      } else {
        const created = { ...routeData, id: Date.now().toString() }
        setRoutes([...routes, created])
        toast({
          title: "Success",
          description: "Route created successfully",
        })
      }
      setModalOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save route",
        variant: "destructive",
      })
    }
  }

  const getTrafficBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "low":
        return { label: "Low", color: "bg-green-100 text-green-800" }
      case "medium":
        return { label: "Medium", color: "bg-yellow-100 text-yellow-800" }
      case "high":
        return { label: "High", color: "bg-red-100 text-red-800" }
      default:
        return { label: level, color: "bg-gray-100 text-gray-800" }
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Routes Management</h1>
          <p className="text-gray-600 mt-1">Manage delivery routes and their configurations</p>
        </div>
        <Button onClick={handleAddRoute} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Route
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Route className="h-4 w-4" />
              Total Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{routes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {routes.length > 0 ? Math.round(routes.reduce((sum, r) => sum + r.distanceKm, 0) / routes.length) : 0}
              km
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">High Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {routes.filter((r) => r.trafficLevel.toLowerCase() === "high").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {routes.length > 0
                ? Math.round(routes.reduce((sum, r) => sum + r.baseTimeMinutes, 0) / routes.length)
                : 0}
              min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Routes</CardTitle>
          <CardDescription>Complete list of delivery routes with their specifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route ID</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Traffic Level</TableHead>
                <TableHead>Base Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => {
                const trafficBadge = getTrafficBadge(route.trafficLevel)

                return (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.routeId}</TableCell>
                    <TableCell>{route.distanceKm} km</TableCell>
                    <TableCell>
                      <Badge className={trafficBadge.color}>{trafficBadge.label}</Badge>
                    </TableCell>
                    <TableCell>{route.baseTimeMinutes} min</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRoute(route)}
                          className="bg-transparent"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRoute(route.id)}
                          className="bg-transparent text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Route Modal */}
      <RouteModal open={modalOpen} onOpenChange={setModalOpen} route={editingRoute} onSave={handleSaveRoute} />
    </div>
  )
}
