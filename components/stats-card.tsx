"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: number
}

export default function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-card to-secondary/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend !== undefined && (
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend > 0 ? "+" : ""}
              {trend}%
            </p>
          )}
        </div>
        {icon && <div className="text-primary opacity-50">{icon}</div>}
      </div>
    </Card>
  )
}
