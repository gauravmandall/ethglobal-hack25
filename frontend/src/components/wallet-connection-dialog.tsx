"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy } from "lucide-react"
import { useState } from "react"

interface WalletConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletAddress: string
}

export function WalletConnectionDialog({ open, onOpenChange, walletAddress }: WalletConnectionDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center">
            <CheckCircle className="w-5 h-5 text-white" />
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
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </code>
              <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            {copied && <p className="text-xs text-white">Copied!</p>}
          </div>

          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Start Trading
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
