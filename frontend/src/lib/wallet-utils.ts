export function formatBalance(balance: string, decimals: number = 4): string {
  if (!balance || balance === '0') return '0.0000'
  
  const num = parseFloat(balance)
  if (isNaN(num)) return '0.0000'
  if (num === 0) return '0.0000'
  if (num < 0.0001) return '< 0.0001'
  return num.toFixed(decimals)
}

export function formatBalanceForDisplay(balance: string): string {
  if (!balance || balance === '0') return '0.0000 ETH'
  
  const num = parseFloat(balance)
  if (isNaN(num)) return '0.0000 ETH'
  if (num === 0) return '0.0000 ETH'
  if (num < 0.0001) return '< 0.0001 ETH'
  return `${num.toFixed(4)} ETH`
}

export function getBalanceInUSD(balance: string, ethPrice: number = 2450): string {
  const ethAmount = parseFloat(balance)
  return (ethAmount * ethPrice).toFixed(2)
}

export function getNetworkInfo(chainId: number) {
  const networks = {
    1: { name: 'Ethereum', color: 'bg-blue-500', explorer: 'https://etherscan.io' },
    137: { name: 'Polygon', color: 'bg-purple-500', explorer: 'https://polygonscan.com' },
    42161: { name: 'Arbitrum', color: 'bg-cyan-500', explorer: 'https://arbiscan.io' },
    10: { name: 'Optimism', color: 'bg-red-500', explorer: 'https://optimistic.etherscan.io' },
    8453: { name: 'Base', color: 'bg-blue-600', explorer: 'https://basescan.org' },
    11155111: { name: 'Sepolia', color: 'bg-gray-500', explorer: 'https://sepolia.etherscan.io' },
  }
  
  return networks[chainId as keyof typeof networks] || {
    name: `Chain ${chainId}`,
    color: 'bg-gray-500',
    explorer: 'https://etherscan.io'
  }
}

export function getExplorerUrl(address: string, chainId: number): string {
  const networkInfo = getNetworkInfo(chainId)
  return `${networkInfo.explorer}/address/${address}`
}

export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '0x0000...0000'
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}
