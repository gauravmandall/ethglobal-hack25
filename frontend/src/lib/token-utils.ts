// Common token addresses for different chains
export const COMMON_TOKENS = {
  "1": {
    ETH: { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum", decimals: 18 },
    USDC: { address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", symbol: "USDC", name: "USD Coin", decimals: 6 },
    USDT: { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", name: "Tether", decimals: 6 },
    DAI: { address: "0x6b175474e89094c44da98b954eedeac495271d0f", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
    WETH: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", symbol: "WETH", name: "Wrapped Ethereum", decimals: 18 },
  },
  "137": {
    MATIC: { address: "0x0000000000000000000000000000000000000000", symbol: "MATIC", name: "Polygon", decimals: 18 },
    USDC: { address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", symbol: "USDC", name: "USD Coin", decimals: 6 },
    USDT: { address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", symbol: "USDT", name: "Tether", decimals: 6 },
    DAI: { address: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
    WMATIC: { address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", symbol: "WMATIC", name: "Wrapped Matic", decimals: 18 },
  },
  "8453": {
    ETH: { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum", decimals: 18 },
    USDC: { address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", symbol: "USDC", name: "USD Coin", decimals: 6 },
    DAI: { address: "0x50c5725949a6f0c72e6c4a641f24049a917db0cb", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
    WETH: { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", name: "Wrapped Ethereum", decimals: 18 },
  },
  "42161": {
    ETH: { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum", decimals: 18 },
    USDC: { address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831", symbol: "USDC", name: "USD Coin", decimals: 6 },
    USDT: { address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", symbol: "USDT", name: "Tether", decimals: 6 },
    DAI: { address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
    WETH: { address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", symbol: "WETH", name: "Wrapped Ethereum", decimals: 18 },
  },
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export function getTokenAddress(symbol: string, chainId: number): string {
  const chainTokens = COMMON_TOKENS[chainId.toString() as keyof typeof COMMON_TOKENS]
  if (!chainTokens) {
    // Default to Ethereum if chain not found
    const ethTokens = COMMON_TOKENS["1"]
    return ethTokens[symbol as keyof typeof ethTokens]?.address || "0x0000000000000000000000000000000000000000"
  }
  
  const token = chainTokens[symbol as keyof typeof chainTokens]
  return token?.address || "0x0000000000000000000000000000000000000000"
}

export function getTokenInfo(symbol: string, chainId: number): TokenInfo | null {
  const chainTokens = COMMON_TOKENS[chainId.toString() as keyof typeof COMMON_TOKENS]
  if (!chainTokens) {
    // Default to Ethereum if chain not found
    const ethTokens = COMMON_TOKENS["1"]
    return ethTokens[symbol as keyof typeof ethTokens] || null
  }
  
  return chainTokens[symbol as keyof typeof chainTokens] || null
}

export function getSupportedTokens(chainId: number): TokenInfo[] {
  const chainTokens = COMMON_TOKENS[chainId.toString() as keyof typeof COMMON_TOKENS]
  if (!chainTokens) {
    // Default to Ethereum if chain not found
    return Object.values(COMMON_TOKENS["1"])
  }
  
  return Object.values(chainTokens)
}
