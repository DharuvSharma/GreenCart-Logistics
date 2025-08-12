"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Order {
  id: string
  orderId: string
  value_rs: number
  routeId: string
  deliveryTimestamp: string
}

interface OrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onSave: (order: Omit<Order, "id">) => void
}

const availableRoutes = ["R001", "R002", "R003", "Route A", "Route B", "Route C"]

export function OrderModal({ open, onOpenChange, order, onSave }: OrderModalProps) {
  const [formData, setFormData] = useState({
    orderId: "",
    value_rs: 0,
    routeId: "",
    deliveryTimestamp: "",
  })

  useEffect(() => {
    if (order) {
      setFormData({
        orderId: order.orderId,
        value_rs: order.value_rs,
        routeId: order.routeId,
        deliveryTimestamp: order.deliveryTimestamp.slice(0, 16), // Format for datetime-local input
      })
    } else {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      setFormData({
        orderId: "",
        value_rs: 0,
        routeId: "",
        deliveryTimestamp: tomorrow.toISOString().slice(0, 16),
      })
    }
  }, [order, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      deliveryTimestamp: new Date(formData.deliveryTimestamp).toISOString(),
    }
    onSave(submitData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{order ? "Edit Order" : "Add New Order"}</DialogTitle>
          <DialogDescription>
            {order ? "Update order information and assignment" : "Create a new delivery order"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID</Label>
            <Input
              id="orderId"
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              placeholder="e.g., ORD-001, ORDER-123"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value_rs">Order Value (₹)</Label>
            <Input
              id="value_rs"
              type="number"
              min="1"
              max="50000"
              value={formData.value_rs}
              onChange={(e) => setFormData({ ...formData, value_rs: Number.parseInt(e.target.value) || 0 })}
              placeholder="Enter order value in rupees"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routeId">Assigned Route</Label>
            <Select value={formData.routeId} onValueChange={(value) => setFormData({ ...formData, routeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a route" />
              </SelectTrigger>
              <SelectContent>
                {availableRoutes.map((route) => (
                  <SelectItem key={route} value={route}>
                    {route}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryTimestamp">Delivery Date & Time</Label>
            <Input
              id="deliveryTimestamp"
              type="datetime-local"
              value={formData.deliveryTimestamp}
              onChange={(e) => setFormData({ ...formData, deliveryTimestamp: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {order ? "Update Order" : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
