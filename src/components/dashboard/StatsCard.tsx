import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: number | string
  description?: string
  icon: React.ReactNode
  color?: "blue" | "green" | "orange" | "purple" | "red"
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  orange: "bg-orange-50 text-orange-600",
  purple: "bg-purple-50 text-purple-600",
  red: "bg-red-50 text-red-600",
}

export function StatsCard({ title, value, description, icon, color = "blue" }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6 border-none shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={cn("p-3 rounded-full", colorMap[color])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
