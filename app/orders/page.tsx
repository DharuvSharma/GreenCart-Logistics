"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { OrderModal } from "@/components/modals/order-modal"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Package, DollarSign } from "lucide-react"

interface Order {
  id: string
  orderId: string
  value_rs: number
  routeId: string
  deliveryTimestamp: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const { toast } = useToast()

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders()
      setOrders(data as Order[])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddOrder = () => {
    setEditingOrder(null)
    setModalOpen(true)
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    setModalOpen(true)
  }

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return

    try {
      // Mock delete - replace with actual API call
      setOrders(orders.filter((o) => o.id !== id))
      toast({
        title: "Success",
        description: "Order deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  const handleSaveOrder = async (orderData: Omit<Order, "id">) => {
    try {
      if (editingOrder) {
        const updated = { ...orderData, id: editingOrder.id }
        setOrders(orders.map((o) => (o.id === editingOrder.id ? updated : o)))
        toast({
          title: "Success",
          description: "Order updated successfully",
        })
      } else {
        const created = { ...orderData, id: Date.now().toString() }
        setOrders([...orders, created])
        toast({
          title: "Success",
          description: "Order created successfully",
        })
      }
      setModalOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save order",
        variant: "destructive",
      })
    }
  }

  const getOrderValueBadge = (value: number) => {
    if (value >= 2000) return { label: "High Value", color: "bg-purple-100 text-purple-800" }
    if (value >= 1000) return { label: "Medium Value", color: "bg-blue-100 text-blue-800" }
    return { label: "Standard", color: "bg-gray-100 text-gray-800" }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  useEffect(() => {
    fetchOrders()
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
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage delivery orders and their assignments</p>
        </div>
        <Button onClick={handleAddOrder} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₹{orders.reduce((sum, o) => sum + o.value_rs, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">High Value Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{orders.filter((o) => o.value_rs >= 2000).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₹{orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.value_rs, 0) / orders.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Complete list of orders with their details and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Delivery Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const valueBadge = getOrderValueBadge(order.value_rs)

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderId}</TableCell>
                    <TableCell>₹{order.value_rs.toLocaleString()}</TableCell>
                    <TableCell>{order.routeId}</TableCell>
                    <TableCell>{formatDate(order.deliveryTimestamp)}</TableCell>
                    <TableCell>
                      <Badge className={valueBadge.color}>{valueBadge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOrder(order)}
                          className="bg-transparent"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
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

      {/* Order Modal */}
      <OrderModal open={modalOpen} onOpenChange={setModalOpen} order={editingOrder} onSave={handleSaveOrder} />
    </div>
  )
}
