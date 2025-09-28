"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  LogOut, 
  ChevronDown, 
  Network,
  DollarSign,
  TrendingUp,
  RefreshCw
} from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { getWalletIcon } from "./wallet-icons"
import { formatBalance, getBalanceInUSD, getNetworkInfo, getExplorerUrl } from "@/lib/wallet-utils"

interface WalletStatsDropdownProps {
  className?: string
}

export function WalletStatsDropdown({ className }: WalletStatsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { 
    address, 
    balance, 
    chainId, 
    connector, 
    formatAddress, 
    disconnectWallet 
  } = useWallet()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setIsOpen(false)
  }

  const handleRefreshBalance = async () => {
    setRefreshing(true)
    // In a real app, you might want to refetch the balance here
    // For now, we'll just simulate a refresh
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const networkInfo = getNetworkInfo(chainId || 1)

  if (!address) return null

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Wallet className="w-4 h-4" />
        {formatAddress(address)}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-80 p-4 z-50 shadow-lg border">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getWalletIcon(connector?.id || 'injected', 'w-6 h-6')}
                <div>
                  <p className="font-medium text-sm">{connector?.name || 'Wallet'}</p>
                  <p className="text-xs text-muted-foreground">{networkInfo.name}</p>
                </div>
              </div>
              <Badge className={`${networkInfo.color} text-white text-xs`}>
                <Network className="w-3 h-3 mr-1" />
                {networkInfo.name}
              </Badge>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Wallet Address</p>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <code className="flex-1 text-xs font-mono">
                  {formatAddress(address)}
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-6 w-6 p-0">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              {copied && <p className="text-xs text-green-500">Copied!</p>}
            </div>

            {/* Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Balance</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefreshBalance}
                  disabled={refreshing}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-lg">{formatBalance(balance)} ETH</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ≈ ${getBalanceInUSD(balance)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2.45% (24h)</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => window.open(getExplorerUrl(address, chainId || 1), '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Explorer
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex-1"
                onClick={handleDisconnect}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
