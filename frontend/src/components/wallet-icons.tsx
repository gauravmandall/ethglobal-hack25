import React from 'react'

interface WalletIconProps {
  className?: string
}

export function MetaMaskIcon({ className = "w-6 h-6" }: WalletIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M20.945 1L13.5 7.5L15.5 3L20.945 1Z"
        fill="#E2761B"
      />
      <path
        d="M3.055 1L10.5 7.5L8.5 3L3.055 1Z"
        fill="#E4761B"
      />
      <path
        d="M17.5 15.5L15.5 19L20.5 20L22 15.5L17.5 15.5Z"
        fill="#E4761B"
      />
      <path
        d="M2 15.5L3.5 20L8.5 19L6.5 15.5L2 15.5Z"
        fill="#E4761B"
      />
      <path
        d="M7.5 9.5L6 11L10.5 11.5L10 6.5L7.5 9.5Z"
        fill="#E4761B"
      />
      <path
        d="M16.5 9.5L14 6.5L13.5 11.5L18 11L16.5 9.5Z"
        fill="#E4761B"
      />
      <path
        d="M8.5 19L11 17L9 15.5L8.5 19Z"
        fill="#E4761B"
      />
      <path
        d="M15 17L17.5 19L17 15.5L15 17Z"
        fill="#E4761B"
      />
    </svg>
  )
}

export function WalletConnectIcon({ className = "w-6 h-6" }: WalletIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
        fill="#3B99FC"
      />
    </svg>
  )
}

export function PhantomIcon({ className = "w-6 h-6" }: WalletIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
        fill="#AB9FF2"
      />
    </svg>
  )
}

export function CoinbaseIcon({ className = "w-6 h-6" }: WalletIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"
        fill="#0052FF"
      />
    </svg>
  )
}

export function TrustWalletIcon({ className = "w-6 h-6" }: WalletIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"
        fill="#3375BB"
      />
    </svg>
  )
}

export function getWalletIcon(connectorId: string, className?: string) {
  switch (connectorId) {
    case 'metaMask':
      return <MetaMaskIcon className={className} />
    case 'walletConnect':
      return <WalletConnectIcon className={className} />
    case 'coinbaseWallet':
      return <CoinbaseIcon className={className} />
    case 'trust':
      return <TrustWalletIcon className={className} />
    default:
      return <div className={`${className} bg-muted rounded`} />
  }
}
