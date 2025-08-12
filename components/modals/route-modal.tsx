"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RouteData {
  id: string
  routeId: string
  distanceKm: number
  trafficLevel: string
  baseTimeMinutes: number
}

interface RouteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route: RouteData | null
  onSave: (route: Omit<RouteData, "id">) => void
}

export function RouteModal({ open, onOpenChange, route, onSave }: RouteModalProps) {
  const [formData, setFormData] = useState({
    routeId: "",
    distanceKm: 0,
    trafficLevel: "Medium",
    baseTimeMinutes: 0,
  })

  useEffect(() => {
    if (route) {
      setFormData({
        routeId: route.routeId,
        distanceKm: route.distanceKm,
        trafficLevel: route.trafficLevel,
        baseTimeMinutes: route.baseTimeMinutes,
      })
    } else {
      setFormData({
        routeId: "",
        distanceKm: 0,
        trafficLevel: "Medium",
        baseTimeMinutes: 0,
      })
    }
  }, [route, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{route ? "Edit Route" : "Add New Route"}</DialogTitle>
          <DialogDescription>
            {route ? "Update route information and specifications" : "Create a new delivery route"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="routeId">Route ID</Label>
            <Input
              id="routeId"
              value={formData.routeId}
              onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
              placeholder="e.g., Route A, R001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="distanceKm">Distance (km)</Label>
            <Input
              id="distanceKm"
              type="number"
              min="1"
              max="200"
              value={formData.distanceKm}
              onChange={(e) => setFormData({ ...formData, distanceKm: Number.parseInt(e.target.value) || 0 })}
              placeholder="Enter distance in kilometers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trafficLevel">Traffic Level</Label>
            <Select
              value={formData.trafficLevel}
              onValueChange={(value) => setFormData({ ...formData, trafficLevel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select traffic level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseTimeMinutes">Base Time (minutes)</Label>
            <Input
              id="baseTimeMinutes"
              type="number"
              min="10"
              max="300"
              value={formData.baseTimeMinutes}
              onChange={(e) => setFormData({ ...formData, baseTimeMinutes: Number.parseInt(e.target.value) || 0 })}
              placeholder="Enter base delivery time"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {route ? "Update Route" : "Create Route"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
