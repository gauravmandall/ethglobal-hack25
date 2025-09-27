"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search } from "lucide-react"

const TOKENS = [
  { symbol: "ETH", name: "Ethereum", balance: "2.5", price: "$2,450.00" },
  { symbol: "USDC", name: "USD Coin", balance: "1,250.00", price: "$1.00" },
  { symbol: "USDT", name: "Tether", balance: "500.00", price: "$1.00" },
  { symbol: "BTC", name: "Bitcoin", balance: "0.1", price: "$43,250.00" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", balance: "0.05", price: "$43,200.00" },
  { symbol: "DAI", name: "Dai Stablecoin", balance: "750.00", price: "$1.00" },
  { symbol: "UNI", name: "Uniswap", balance: "25.0", price: "$8.50" },
  { symbol: "LINK", name: "Chainlink", balance: "50.0", price: "$15.25" },
]

interface TokenSelectorProps {
  selectedToken: string
  onTokenSelect: (token: string) => void
  compact?: boolean
}

export function TokenSelector({ selectedToken, onTokenSelect, compact = false }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredTokens = TOKENS.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedTokenData = TOKENS.find((token) => token.symbol === selectedToken)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={compact ? "h-8 px-2" : "h-10 px-3"}>
          <div className="flex items-center gap-2">
            <div
              className={`${compact ? "w-4 h-4" : "w-5 h-5"} bg-primary rounded-full flex items-center justify-center`}
            >
              <span className={`${compact ? "text-xs" : "text-sm"} font-bold text-primary-foreground`}>
                {selectedToken[0]}
              </span>
            </div>
            <span className={`font-semibold ${compact ? "text-sm" : ""}`}>{selectedToken}</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filteredTokens.map((token) => (
              <Button
                key={token.symbol}
                variant="ghost"
                className="w-full justify-between h-auto p-3"
                onClick={() => {
                  onTokenSelect(token.symbol)
                  setOpen(false)
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">{token.symbol[0]}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{token.balance}</div>
                  <div className="text-xs text-muted-foreground">{token.price}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
