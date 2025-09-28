"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, Settings, Wallet, TrendingUp, Clock, Zap, RefreshCw } from "lucide-react"
import { TokenSelector } from "./token-selector"
import { OrderBook } from "./order-book"
import { PriceChart } from "./price-chart"
import { RecentTrades } from "./recent-trades"
import { WalletConnectionDialog } from "./wallet-connection-dialog"
import { WalletStatsDropdown } from "./wallet-stats-dropdown"
import { useWallet } from "@/hooks/use-wallet"
import { formatBalanceForDisplay } from "@/lib/wallet-utils"

export function SwapInterface() {
  const [swapMode, setSwapMode] = useState<"instant" | "limit">("instant")
  const [fromToken, setFromToken] = useState("ETH")
  const [toToken, setToToken] = useState("USDC")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [limitPrice, setLimitPrice] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  
  const { 
    isConnected, 
    address, 
    balance, 
    balanceLoading,
    formatAddress 
  } = useWallet()

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleConnectWallet = () => {
    setShowWalletOptions(true)
    setShowConnectionDialog(true)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-balance">1inch swapp</h1>
            <p className="text-muted-foreground">make sure no one&apos;s watching you</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Badge variant="outline" className="gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Connected
              </Badge>
              <WalletStatsDropdown />
            </>
          ) : (
            <Button onClick={handleConnectWallet} className="gap-2">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trading Interface */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            {!isConnected ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Connect your wallet to start trading cryptocurrencies with instant swaps and limit orders.
                </p>
                <Button onClick={handleConnectWallet} size="lg" className="gap-2">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <Tabs value={swapMode} onValueChange={(value) => setSwapMode(value as "instant" | "limit")}>
                <div className="flex items-center justify-between mb-6">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="instant" className="gap-2">
                      <Zap className="w-4 h-4" />
                      Instant Swap
                    </TabsTrigger>
                    <TabsTrigger value="limit" className="gap-2">
                      <Clock className="w-4 h-4" />
                      Limit Order
                    </TabsTrigger>
                  </TabsList>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>

                <TabsContent value="instant" className="space-y-4">
                  {/* From Token */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">From</label>
                      <span className="text-xs text-muted-foreground">
                        Balance: {balanceLoading ? 'Loading...' : formatBalanceForDisplay(balance)}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="text-2xl font-mono h-16 pr-32"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <TokenSelector selectedToken={fromToken} onTokenSelect={setFromToken} />
                      </div>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSwapTokens}
                      className="rounded-full w-10 h-10 p-0 bg-transparent"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* To Token */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">To</label>
                      <span className="text-xs text-muted-foreground">Balance: 1,250.00 USDC</span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={toAmount}
                        onChange={(e) => setToAmount(e.target.value)}
                        className="text-2xl font-mono h-16 pr-32"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <TokenSelector selectedToken={toToken} onTokenSelect={setToToken} />
                      </div>
                    </div>
                  </div>

                  {/* Swap Details */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-mono">1 ETH = 2,450.00 USDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Slippage</span>
                      <span className="font-mono">{slippage}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Network Fee</span>
                      <span className="font-mono">~$12.50</span>
                    </div>
                  </div>

                  <Button className="w-full h-12 text-lg font-semibold">Swap Tokens</Button>
                </TabsContent>

                <TabsContent value="limit" className="space-y-4">
                  {/* Limit Order Interface */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Pay</label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          className="font-mono h-12 pr-20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <TokenSelector selectedToken={fromToken} onTokenSelect={setFromToken} compact />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Receive</label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={toAmount}
                          onChange={(e) => setToAmount(e.target.value)}
                          className="font-mono h-12 pr-20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <TokenSelector selectedToken={toToken} onTokenSelect={setToToken} compact />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Limit Price</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="2,450.00"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="font-mono h-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        USDC per ETH
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order Type</label>
                    <Select defaultValue="good-till-cancelled">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good-till-cancelled">Good Till Cancelled</SelectItem>
                        <SelectItem value="immediate-or-cancel">Immediate or Cancel</SelectItem>
                        <SelectItem value="fill-or-kill">Fill or Kill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Price</span>
                      <span className="font-mono">2,450.00 USDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price Difference</span>
                      <span className="font-mono text-green-600">+0.00%</span>
                    </div>
                  </div>

                  <Button className="w-full h-12 text-lg font-semibold">Place Limit Order</Button>
                </TabsContent>
              </Tabs>
            )}
          </Card>

          {/* Price Chart */}
          {isConnected && <PriceChart />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Market Stats */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" />
              <h3 className="font-semibold">Market Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">24h Volume</span>
                <span className="text-sm font-mono">$2.4B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">24h Change</span>
                <span className="text-sm font-mono text-green-600">+2.45%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">TVL</span>
                <span className="text-sm font-mono">$1.2B</span>
              </div>
            </div>
          </Card>

          {/* Order Book */}
          {isConnected && <OrderBook />}

          {/* Recent Trades */}
          {isConnected && <RecentTrades />}
        </div>
      </div>

      <WalletConnectionDialog
        open={showConnectionDialog}
        onOpenChange={(open) => {
          setShowConnectionDialog(open)
          if (!open) setShowWalletOptions(false)
        }}
        walletAddress={address}
        showWalletOptions={showWalletOptions}
      />
    </div>
  )
}