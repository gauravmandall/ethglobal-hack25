"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"

const BIDS = [
  { price: "2,449.50", amount: "1.25", total: "3,061.88" },
  { price: "2,449.00", amount: "0.85", total: "2,081.65" },
  { price: "2,448.50", amount: "2.10", total: "5,141.85" },
  { price: "2,448.00", amount: "0.95", total: "2,325.60" },
  { price: "2,447.50", amount: "1.75", total: "4,283.13" },
]

const ASKS = [
  { price: "2,450.50", amount: "0.75", total: "1,837.88" },
  { price: "2,451.00", amount: "1.20", total: "2,941.20" },
  { price: "2,451.50", amount: "0.90", total: "2,206.35" },
  { price: "2,452.00", amount: "1.85", total: "4,536.20" },
  { price: "2,452.50", amount: "0.65", total: "1,594.13" },
]

export function OrderBook() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4" />
        <h3 className="font-semibold">Order Book</h3>
        <Badge variant="outline" className="ml-auto text-xs">
          ETH/USDC
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Header */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium">
          <span>Price (USDC)</span>
          <span className="text-right">Amount (ETH)</span>
          <span className="text-right">Total</span>
        </div>

        {/* Asks (Sell Orders) */}
        <div className="space-y-1">
          {ASKS.reverse().map((ask, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 text-xs font-mono hover:bg-muted/50 p-1 rounded">
              <span className="text-red-600">{ask.price}</span>
              <span className="text-right">{ask.amount}</span>
              <span className="text-right text-muted-foreground">{ask.total}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="flex items-center justify-center py-2 border-y">
          <Badge variant="outline" className="text-xs">
            Spread: $1.00 (0.04%)
          </Badge>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="space-y-1">
          {BIDS.map((bid, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 text-xs font-mono hover:bg-muted/50 p-1 rounded">
              <span className="text-green-600">{bid.price}</span>
              <span className="text-right">{bid.amount}</span>
              <span className="text-right text-muted-foreground">{bid.total}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
