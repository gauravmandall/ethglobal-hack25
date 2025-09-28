"use client"

import { useAccount, useConnect, useDisconnect, useChainId, useBalance } from 'wagmi'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { formatEther } from 'viem'
import { balanceApiService } from '@/lib/balance-api'

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
  const currentChainId = useChainId()
  const queryClient = useQueryClient()
  const [isConnecting, setIsConnecting] = useState(false)

  // Fallback balance from wagmi (direct blockchain call)
  const { data: wagmiBalance } = useBalance({
    address: address,
    query: {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  })

  // Use React Query to fetch balance from our backend API
  const { 
    data: balance, 
    isLoading: balanceLoading, 
    refetch: refetchBalance,
    error: balanceError 
  } = useQuery({
    queryKey: ['wallet-balance', address, chainId || currentChainId],
    queryFn: async () => {
      if (!address) {
        console.log('No address available for balance fetch')
        return '0'
      }
      const chainIdToUse = chainId || currentChainId || 1
      console.log(`Fetching balance for ${address} on chain ${chainIdToUse}`)
      try {
        const result = await balanceApiService.getETHBalance(chainIdToUse, address)
        console.log('Balance fetch result:', result)
        return result
      } catch (error) {
        console.error('Balance fetch error:', error)
        throw error
      }
    },
    enabled: !!address && isConnected && (!!chainId || !!currentChainId),
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: 3,
    retryDelay: 1000,
  })

  // Use backend balance if available, otherwise fallback to wagmi balance
  const finalBalance = balance || (wagmiBalance ? formatEther(wagmiBalance.value) : '0')

  // Debug log to verify balance fetching
  console.log('Wallet Hook Debug:', {
    address,
    isConnected,
    backendBalance: balance || '0',
    wagmiBalance: wagmiBalance ? formatEther(wagmiBalance.value) : '0',
    finalBalance,
    balanceLoading,
    balanceError,
    chainId: chainId || currentChainId
  })

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
      balance: balance || '0',
      chainId: chainId || currentChainId || 1,
      isConnected,
      connector,
    }
  }, [address, balance, chainId, currentChainId, isConnected, connector])

  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])

  const refreshBalance = useCallback(async () => {
    if (address) {
      await refetchBalance()
      // Also invalidate any cached balance queries
      await queryClient.invalidateQueries({
        queryKey: ['wallet-balance', address, chainId || currentChainId]
      })
    }
  }, [address, refetchBalance, queryClient, chainId, currentChainId])

  return {
    // State
    address,
    isConnected,
    chainId: chainId || currentChainId,
    connector,
    balance: finalBalance,
    balanceLoading,
    balanceError,
    isConnecting,
    isPending,
    
    // Actions
    connectWallet,
    disconnectWallet,
    refreshBalance,
    getWalletInfo,
    formatAddress,
    
    // Available connectors
    connectors,
  }
}
