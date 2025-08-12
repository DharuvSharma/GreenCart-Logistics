"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Driver {
  id: string
  name: string
  currentShiftHours: number
  past7DayHours: number[]
}

interface DriverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver: Driver | null
  onSave: (driver: Omit<Driver, "id">) => void
}

export function DriverModal({ open, onOpenChange, driver, onSave }: DriverModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    currentShiftHours: 0,
    past7DayHours: [0, 0, 0, 0, 0, 0, 0],
  })

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name,
        currentShiftHours: driver.currentShiftHours,
        past7DayHours: driver.past7DayHours,
      })
    } else {
      setFormData({
        name: "",
        currentShiftHours: 0,
        past7DayHours: [0, 0, 0, 0, 0, 0, 0],
      })
    }
  }, [driver, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleHourChange = (dayIndex: number, hours: number) => {
    const newHours = [...formData.past7DayHours]
    newHours[dayIndex] = Math.max(0, Math.min(12, hours))
    setFormData({ ...formData, past7DayHours: newHours })
  }

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{driver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
          <DialogDescription>
            {driver ? "Update driver information and schedule" : "Create a new driver profile"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Driver Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter driver name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentShiftHours">Current Shift Hours</Label>
            <Input
              id="currentShiftHours"
              type="number"
              min="0"
              max="12"
              step="0.5"
              value={formData.currentShiftHours}
              onChange={(e) => setFormData({ ...formData, currentShiftHours: Number.parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Past 7 Days Hours</Label>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => (
                <div key={day} className="space-y-1">
                  <Label className="text-xs text-center block">{day}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="12"
                    step="0.5"
                    value={formData.past7DayHours[index]}
                    onChange={(e) => handleHourChange(index, Number.parseFloat(e.target.value) || 0)}
                    className="text-center text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {driver ? "Update Driver" : "Create Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
