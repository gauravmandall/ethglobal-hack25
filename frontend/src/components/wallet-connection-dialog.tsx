"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Loader2 } from "lucide-react"
import { useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { getWalletIcon } from "./wallet-icons"

interface WalletConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletAddress?: string
  showWalletOptions?: boolean
}

export function WalletConnectionDialog({ 
  open, 
  onOpenChange, 
  walletAddress, 
  showWalletOptions = false 
}: WalletConnectionDialogProps) {
  const [copied, setCopied] = useState(false)
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)
  const { connectWallet, connectors, isConnected, address, formatAddress } = useWallet()

  const handleCopyAddress = async () => {
    if (walletAddress || address) {
      await navigator.clipboard.writeText(walletAddress || address || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConnectWallet = async (connectorId: string) => {
    try {
      setConnectingWallet(connectorId)
      await connectWallet(connectorId)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setConnectingWallet(null)
    }
  }

  const currentAddress = walletAddress || address

  if (showWalletOptions && !isConnected) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Connect Wallet</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                variant="outline"
                className="w-full justify-start h-14 px-4"
                onClick={() => handleConnectWallet(connector.id)}
                disabled={connectingWallet === connector.id}
              >
                <div className="flex items-center gap-3">
                  {getWalletIcon(connector.id, "w-6 h-6")}
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{connector.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {connector.id === 'metaMask' && 'Connect using MetaMask browser extension'}
                      {connector.id === 'walletConnect' && 'Connect using WalletConnect'}
                      {connector.id === 'coinbaseWallet' && 'Connect using Coinbase Wallet'}
                      {connector.id === 'injected' && 'Connect using browser wallet'}
                    </span>
                  </div>
                  {connectingWallet === connector.id && (
                    <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          <div className="text-center text-xs text-muted-foreground">
            By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Wallet Connected!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border border-border">
              <img
                src="/celebration-meme-placeholder.jpg"
                alt="Celebration meme"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <code className="flex-1 text-xs font-mono text-center">
                {currentAddress ? formatAddress(currentAddress) : '0x0000...0000'}
              </code>
              <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            {copied && <p className="text-xs text-green-500">Copied!</p>}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => window.open(`https://etherscan.io/address/${currentAddress}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Start Trading
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
