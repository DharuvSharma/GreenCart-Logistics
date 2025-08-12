import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string
  description: string
  trend?: "up" | "down"
  trendValue?: string
  icon?: React.ReactNode
  className?: string
}

export function KpiCard({ title, value, description, trend, trendValue, icon, className }: KpiCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center text-xs font-medium px-2 py-1 rounded-full",
              trend === "up" ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100",
            )}
          >
            {trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {trendValue}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </CardContent>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/30 pointer-events-none" />
    </Card>
  )
}
