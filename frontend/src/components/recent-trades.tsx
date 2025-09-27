"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

const TRADES = [
  { price: "2,450.25", amount: "0.85", time: "14:32:15", type: "buy" },
  { price: "2,449.80", amount: "1.20", time: "14:31:58", type: "sell" },
  { price: "2,450.10", amount: "0.45", time: "14:31:42", type: "buy" },
  { price: "2,449.95", amount: "2.10", time: "14:31:28", type: "sell" },
  { price: "2,450.50", amount: "0.75", time: "14:31:15", type: "buy" },
  { price: "2,449.75", amount: "1.85", time: "14:30:58", type: "sell" },
  { price: "2,450.00", amount: "0.95", time: "14:30:42", type: "buy" },
]

export function RecentTrades() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4" />
        <h3 className="font-semibold">Recent Trades</h3>
        <Badge variant="outline" className="ml-auto text-xs">
          ETH/USDC
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium">
          <span>Price (USDC)</span>
          <span className="text-right">Amount (ETH)</span>
          <span className="text-right">Time</span>
        </div>

        {/* Trades */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {TRADES.map((trade, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 text-xs font-mono hover:bg-muted/50 p-1 rounded">
              <span className={trade.type === "buy" ? "text-green-600" : "text-red-600"}>{trade.price}</span>
              <span className="text-right">{trade.amount}</span>
              <span className="text-right text-muted-foreground">{trade.time}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
