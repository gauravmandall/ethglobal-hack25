"use client"

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { useCallback, useState } from 'react'
import { formatEther } from 'viem'

export interface WalletInfo {
  address: string
  balance: string
  chainId: number
  isConnected: boolean
  connector: any
}

export function useWallet() {
  const { address, isConnected, chainId, connector } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({
    address: address,
  })
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = useCallback(async (connectorId: string) => {
    try {
      setIsConnecting(true)
      const connector = connectors.find((c) => c.id === connectorId)
      if (connector) {
        await connect({ connector })
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [connect, connectors])

  const disconnectWallet = useCallback(() => {
    disconnect()
  }, [disconnect])

  const getWalletInfo = useCallback((): WalletInfo | null => {
    if (!isConnected || !address) return null

    return {
      address,
      balance: balance ? formatEther(balance.value) : '0',
      chainId: chainId || 1,
      isConnected,
      connector,
    }
  }, [address, balance, chainId, isConnected, connector])

  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])

  return {
    // State
    address,
    isConnected,
    chainId,
    connector,
    balance: balance ? formatEther(balance.value) : '0',
    isConnecting,
    isPending,
    
    // Actions
    connectWallet,
    disconnectWallet,
    getWalletInfo,
    formatAddress,
    
    // Available connectors
    connectors,
  }
}
