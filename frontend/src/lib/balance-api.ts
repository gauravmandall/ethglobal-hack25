interface BalanceResponse {
  success: boolean;
  data: Record<string, string>; // tokenAddress -> balance (in wei)
  walletAddress: string;
  chainId: number;
}

interface BalanceApiError {
  success: false;
  error: string;
  message?: string;
  details?: any[];
}

export class BalanceApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://ethglobal-hack25.onrender.com";
  }

  async getWalletBalances(
    chainId: number,
    walletAddress: string
  ): Promise<BalanceResponse> {
    try {
      const url = `${this.baseUrl}/api/balance/${chainId}/${walletAddress}`;
      console.log("Fetching balance from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Balance API response status:", response.status);

      if (!response.ok) {
        const errorData: BalanceApiError = await response.json();
        console.error("Balance API error response:", errorData);
        throw new Error(
          errorData.message || errorData.error || "Failed to fetch balance"
        );
      }

      const data: BalanceResponse = await response.json();
      console.log("Balance API success response:", data);
      return data;
    } catch (error) {
      console.error("Balance API Error:", error);
      throw error;
    }
  }

  async getETHBalance(chainId: number, walletAddress: string): Promise<string> {
    try {
      console.log(
        `Getting ETH balance for ${walletAddress} on chain ${chainId}`
      );
      const response = await this.getWalletBalances(chainId, walletAddress);

      console.log(
        "Available balances count:",
        Object.keys(response.data).length
      );

      // Find ETH balance (ETH has address 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee in 1inch API)
      const ethBalanceWei =
        response.data["0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"];

      console.log("Found ETH balance (wei):", ethBalanceWei);

      if (ethBalanceWei && ethBalanceWei !== "0") {
        // Convert from wei to ETH (ETH has 18 decimals)
        const balanceInWei = BigInt(ethBalanceWei);
        const balanceInETH = Number(balanceInWei) / Math.pow(10, 18);
        console.log(
          `Converted balance: ${balanceInWei} wei -> ${balanceInETH} ETH`
        );
        return balanceInETH.toString();
      }

      console.log("No ETH balance found, returning 0");
      return "0";
    } catch (error) {
      console.error("ETH Balance Error:", error);
      return "0";
    }
  }

  async getTokenBalance(
    chainId: number,
    walletAddress: string,
    tokenAddress: string
  ): Promise<string> {
    try {
      const response = await this.getWalletBalances(chainId, walletAddress);

      const tokenBalanceWei = response.data[tokenAddress.toLowerCase()];

      if (tokenBalanceWei && tokenBalanceWei !== "0") {
        // Note: For token balances, we'd need to fetch token decimals separately
        // For now, we'll assume 18 decimals for most tokens
        const balanceInWei = BigInt(tokenBalanceWei);
        const balanceInTokens = Number(balanceInWei) / Math.pow(10, 18);
        return balanceInTokens.toString();
      }

      return "0";
    } catch (error) {
      console.error("Token Balance Error:", error);
      return "0";
    }
  }
}

export const balanceApiService = new BalanceApiService();
