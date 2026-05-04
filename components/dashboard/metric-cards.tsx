"use client"

import { Users, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

function MetricCard({ title, value, description, icon, trend }: MetricCardProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? "text-alert-green" : "text-alert-red"
              }`}
            >
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MetricCards() {
  const metrics = [
    {
      title: "Total Checked Patients",
      value: "2,847",
      description: "Patients screened this quarter",
      icon: <Users className="h-5 w-5" />,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Active Alerts",
      value: "23",
      description: "Requiring immediate attention",
      icon: <AlertTriangle className="h-5 w-5" />,
      trend: { value: 8, isPositive: false },
    },
    {
      title: "Reports Generated",
      value: "156",
      description: "Clinical reports this month",
      icon: <CheckCircle className="h-5 w-5" />,
      trend: { value: 24, isPositive: true },
    },
    {
      title: "Pending Reviews",
      value: "12",
      description: "Awaiting clinician review",
      icon: <Clock className="h-5 w-5" />,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  )
}
