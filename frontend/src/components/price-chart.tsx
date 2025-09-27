"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp } from "lucide-react"

export function PriceChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">ETH/USDC</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono">$2,450.00</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2.45%
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {["1H", "4H", "1D", "1W", "1M"].map((timeframe) => (
            <Button key={timeframe} variant={timeframe === "1D" ? "default" : "outline"} size="sm" className="text-xs">
              {timeframe}
            </Button>
          ))}
        </div>
      </div>

      {/* Placeholder for chart */}
      <div className="h-80 bg-muted/20 rounded-lg flex items-center justify-center border-2 border-dashed border-muted">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Price chart would be rendered here</p>
          <p className="text-xs text-muted-foreground mt-1">Integration with TradingView or similar charting library</p>
        </div>
      </div>
    </Card>
  )
}
