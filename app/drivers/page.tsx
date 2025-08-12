"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DriverModal } from "@/components/modals/driver-modal"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Users } from "lucide-react"

interface Driver {
  id: string
  name: string
  currentShiftHours: number
  past7DayHours: number[]
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const { toast } = useToast()

  const fetchDrivers = async () => {
    try {
      const data = await api.getDrivers()
      setDrivers(data as Driver[])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddDriver = () => {
    setEditingDriver(null)
    setModalOpen(true)
  }

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver)
    setModalOpen(true)
  }

  const handleDeleteDriver = async (id: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return

    try {
      await api.deleteDriver(id)
      setDrivers(drivers.filter((d) => d.id !== id))
      toast({
        title: "Success",
        description: "Driver deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete driver",
        variant: "destructive",
      })
    }
  }

  const handleSaveDriver = async (driverData: Omit<Driver, "id">) => {
    try {
      if (editingDriver) {
        const updated = await api.updateDriver(editingDriver.id, driverData)
        setDrivers(drivers.map((d) => (d.id === editingDriver.id ? (updated as Driver) : d)))
        toast({
          title: "Success",
          description: "Driver updated successfully",
        })
      } else {
        const created = await api.createDriver(driverData)
        setDrivers([...drivers, created as Driver])
        toast({
          title: "Success",
          description: "Driver created successfully",
        })
      }
      setModalOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save driver",
        variant: "destructive",
      })
    }
  }

  const getWeeklyHours = (hours: number[]) => {
    return hours.reduce((sum, h) => sum + h, 0)
  }

  const getShiftStatus = (currentHours: number) => {
    if (currentHours >= 8) return { label: "Full Shift", color: "bg-green-100 text-green-800" }
    if (currentHours >= 4) return { label: "Partial Shift", color: "bg-yellow-100 text-yellow-800" }
    return { label: "Starting", color: "bg-blue-100 text-blue-800" }
  }

  useEffect(() => {
    fetchDrivers()
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
          <h1 className="text-3xl font-bold text-gray-900">Drivers Management</h1>
          <p className="text-gray-600 mt-1">Manage your delivery drivers and their schedules</p>
        </div>
        <Button onClick={handleAddDriver} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Driver
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{drivers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {drivers.filter((d) => d.currentShiftHours > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Weekly Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {drivers.length > 0
                ? Math.round(drivers.reduce((sum, d) => sum + getWeeklyHours(d.past7DayHours), 0) / drivers.length)
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
          <CardDescription>Complete list of drivers with their current status and work history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Current Shift</TableHead>
                <TableHead>Weekly Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => {
                const status = getShiftStatus(driver.currentShiftHours)
                const weeklyHours = getWeeklyHours(driver.past7DayHours)

                return (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.currentShiftHours}h</TableCell>
                    <TableCell>{weeklyHours}h</TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDriver(driver)}
                          className="bg-transparent"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDriver(driver.id)}
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

      {/* Driver Modal */}
      <DriverModal open={modalOpen} onOpenChange={setModalOpen} driver={editingDriver} onSave={handleSaveDriver} />
    </div>
  )
}
