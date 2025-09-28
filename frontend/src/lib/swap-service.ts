interface SwapQuoteRequest {
  fromChainId: number;
  toChainId: number;
  srcToken: string;
  dstToken: string;
  amount: string;
  walletAddress: string;
}

interface SwapQuoteResponse {
  success: boolean;
  data: {
    quoteId: string;
    fromToken: {
      symbol: string;
      name: string;
      address: string;
      decimals: number;
      amount: string;
    };
    toToken: {
      symbol: string;
      name: string;
      address: string;
      decimals: number;
      amount: string;
    };
    estimatedGas: string;
    presets: Record<string, any>;
    recommendedPreset: string;
  };
}

interface CreateOrderRequest {
  fromChainId: number;
  toChainId: number;
  srcToken: string;
  dstToken: string;
  amount: string;
  walletAddress: string;
  permit?: string;
  isPermit2?: boolean;
  receiver?: string;
  preset?: string;
}

interface CreateOrderResponse {
  success: boolean;
  data: {
    order: any;
    verifyingContract: string;
    extension: string;
    quoteId: string;
    secretHashes: string[];
    srcChainId: number;
    domain: any;
    types: any;
  };
}

interface SubmitOrderRequest {
  order: any;
  srcChainId: number;
  signature: string;
  extension?: string;
  quoteId: string;
  secretHashes: string[];
}

interface SubmitOrderResponse {
  success: boolean;
  data: {
    orderHash: string;
    order: any;
    signature: string;
    quoteId: string;
  };
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface TokenListResponse {
  success: boolean;
  data: {
    tokens: Record<string, TokenInfo>;
  };
}

export class SwapService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  async getQuote(params: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    try {
      const url = `${this.baseUrl}/api/quote`;
      console.log('Getting quote from:', url, params);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Quote API error:', errorData);
        throw new Error(errorData.message || 'Failed to get quote');
      }

      const data: SwapQuoteResponse = await response.json();
      console.log('Quote response:', data);
      return data;
    } catch (error) {
      console.error('Swap Service Quote Error:', error);
      throw error;
    }
  }

  async createOrder(params: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const url = `${this.baseUrl}/api/orders/create`;
      console.log('Creating order:', url, params);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create order API error:', errorData);
        throw new Error(errorData.message || 'Failed to create order');
      }

      const data: CreateOrderResponse = await response.json();
      console.log('Create order response:', data);
      return data;
    } catch (error) {
      console.error('Swap Service Create Order Error:', error);
      throw error;
    }
  }

  async submitOrder(params: SubmitOrderRequest): Promise<SubmitOrderResponse> {
    try {
      const url = `${this.baseUrl}/api/orders/submit`;
      console.log('Submitting order:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Submit order API error:', errorData);
        throw new Error(errorData.message || 'Failed to submit order');
      }

      const data: SubmitOrderResponse = await response.json();
      console.log('Submit order response:', data);
      return data;
    } catch (error) {
      console.error('Swap Service Submit Order Error:', error);
      throw error;
    }
  }

  async getSupportedTokens(chainId: number): Promise<TokenListResponse> {
    try {
      const url = `${this.baseUrl}/api/tokens/${chainId}`;
      console.log('Getting supported tokens:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Get tokens API error:', errorData);
        throw new Error(errorData.message || 'Failed to get supported tokens');
      }

      const data: TokenListResponse = await response.json();
      console.log('Supported tokens response:', data);
      return data;
    } catch (error) {
      console.error('Swap Service Get Tokens Error:', error);
      throw error;
    }
  }

  async getCommonTokens(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/common-tokens`;
      console.log('Getting common tokens:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Get common tokens API error:', errorData);
        throw new Error(errorData.message || 'Failed to get common tokens');
      }

      const data = await response.json();
      console.log('Common tokens response:', data);
      return data;
    } catch (error) {
      console.error('Swap Service Get Common Tokens Error:', error);
      throw error;
    }
  }

  async validateTokens(params: {
    fromChainId: number;
    toChainId: number;
    srcToken: string;
    dstToken: string;
  }): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const url = `${this.baseUrl}/api/validate-tokens`;
      console.log('Validating tokens:', url, params);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Validate tokens API error:', errorData);
        throw new Error(errorData.message || 'Failed to validate tokens');
      }

      const data = await response.json();
      console.log('Validate tokens response:', data);
      return data.data;
    } catch (error) {
      console.error('Swap Service Validate Tokens Error:', error);
      throw error;
    }
  }

  // Utility function to convert amount to wei
  toWei(amount: string, decimals: number = 18): string {
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat)) return '0';
    
    const multiplier = Math.pow(10, decimals);
    return (amountFloat * multiplier).toString();
  }

  // Utility function to convert wei to readable amount
  fromWei(weiAmount: string, decimals: number = 18): string {
    const weiBigInt = BigInt(weiAmount);
    const divisor = BigInt(Math.pow(10, decimals));
    const result = Number(weiBigInt) / Number(divisor);
    return result.toString();
  }
}

export const swapService = new SwapService();
