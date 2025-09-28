"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, Loader2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { getSupportedTokens, TokenInfo } from "@/lib/token-utils"

interface TokenSelectorProps {
  selectedToken: string
  onTokenSelect: (token: string) => void
  compact?: boolean
}

export function TokenSelector({ selectedToken, onTokenSelect, compact = false }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [loading, setLoading] = useState(false)
  const { chainId } = useWallet()

  // Load tokens for the current chain
  useEffect(() => {
    const loadTokens = () => {
      if (!chainId) return
      
      setLoading(true)
      try {
        // Get supported tokens for the current chain
        const tokenList = getSupportedTokens(chainId)
        setTokens(tokenList)
      } catch (error) {
        console.error('Failed to load tokens:', error)
        // Fallback to Ethereum tokens
        const tokenList = getSupportedTokens(1)
        setTokens(tokenList)
      } finally {
        setLoading(false)
      }
    }

    loadTokens()
  }, [chainId])

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedTokenData = tokens.find((token) => token.symbol === selectedToken)

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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading tokens...</span>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => (
                <Button
                  key={token.address}
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
                    <div className="text-xs text-muted-foreground font-mono">
                      {token.address.slice(0, 6)}...{token.address.slice(-4)}
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
