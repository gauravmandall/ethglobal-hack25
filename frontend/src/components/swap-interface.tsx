"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  Settings,
  Wallet,
  TrendingUp,
  Clock,
  Zap,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { TokenSelector } from "./token-selector";
import { OrderBook } from "./order-book";
import { PriceChart } from "./price-chart";
import { RecentTrades } from "./recent-trades";
import { WalletConnectionDialog } from "./wallet-connection-dialog";
import { WalletStatsDropdown } from "./wallet-stats-dropdown";
import { useWallet } from "@/hooks/use-wallet";
import { useSwap } from "@/hooks/use-swap";
import { formatBalanceForDisplay } from "@/lib/wallet-utils";
import { getTokenInfo } from "@/lib/token-utils";
import { swapService } from "@/lib/swap-service";
import { useWalletClient } from "wagmi";
import axios from "axios";

type SwapParams = {
  fromChainId: number;
  toChainId: number;
  srcToken: string;
  dstToken: string;
  amount: string;
  walletAddress: string;
  provider: any;
  receiver?: string;
  preset?: string;
  permit?: string;
  isPermit2?: boolean;
};

export function SwapInterface() {
  const [swapMode, setSwapMode] = useState<"instant" | "limit">("instant");
  const [limitPrice, setLimitPrice] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [limitOrderSuccess, setLimitOrderSuccess] = useState(false);
  const [limitOrderError, setLimitOrderError] = useState<string | null>(null);
  const [isExecutingLimitOrder, setIsExecutingLimitOrder] = useState(false);

  const { isConnected, address, balance, balanceLoading, formatAddress } =
    useWallet();
  const { data: walletClient } = useWalletClient();

  const {
    swapParams,
    quote,
    isLoadingQuote,
    quoteError,
    canSwap,
    isExecuting,
    executionError,
    executionSuccess,
    orderHash,
    updateSwapParams,
    swapTokens,
    executeSwap,
    resetExecution,
    exchangeRate,
    priceImpact,
    estimatedGas,
  } = useSwap();

  async function handleSwapTokens({
    fromChainId,
    toChainId,
    srcToken,
    dstToken,
    amount,
    walletAddress,
    provider,
    receiver,
  }: any) {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://ethglobal-hack25.onrender.com";

      // 1. Get quote
      const { data: quoteRes } = await axios.post(`${baseUrl}/api/quote`, {
        fromChainId,
        toChainId,
        srcToken,
        dstToken,
        amount,
        walletAddress,
      });
      if (!quoteRes.success) throw new Error("Failed to fetch quote");
      const quote = quoteRes.data;

      // 2. Create order
      const { data: orderRes } = await axios.post(
        `${baseUrl}/api/orders/create`,
        {
          fromChainId,
          toChainId,
          srcToken,
          dstToken,
          amount,
          walletAddress,
          receiver,
        }
      );
      if (!orderRes.success) throw new Error("Failed to create order");

      const {
        order,
        verifyingContract,
        extension,
        quoteId,
        secretHashes,
        srcChainId,
        domain,
        types,
      } = orderRes.data;

      // 3. Ask wallet to sign order
      const signer = provider.getSigner();
      const signature = await signer._signTypedData(domain, types, order);

      // 4. Submit signed order
      const { data: submitRes } = await axios.post(
        `${baseUrl}/api/orders/submit`,
        {
          order,
          srcChainId,
          signature,
          extension,
          quoteId,
          secretHashes,
        }
      );
      if (!submitRes.success) throw new Error("Failed to submit order");

      return submitRes.data;
    } catch (err: any) {
      console.error("Swap error:", err);
      throw err;
    }
  }

  async function executeLimitOrder() {
    if (
      !address ||
      !swapParams.fromChainId ||
      !swapParams.toChainId ||
      !swapParams.fromAmount ||
      !limitPrice
    ) {
      setLimitOrderError(
        "Please fill in all required fields for the limit order"
      );
      return;
    }

    if (!walletClient) {
      setLimitOrderError("Wallet client not available");
      return;
    }

    setLimitOrderError(null);
    setLimitOrderSuccess(false);
    setIsExecutingLimitOrder(true);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://ethglobal-hack25.onrender.com";

      // Get token info
      const fromTokenInfo = getTokenInfo(
        swapParams.fromToken,
        swapParams.fromChainId
      );
      const toTokenInfo = getTokenInfo(
        swapParams.toToken,
        swapParams.toChainId
      );

      if (!fromTokenInfo || !toTokenInfo) {
        throw new Error("Invalid token selection");
      }

      const fromAmountWei = swapService.toWei(
        swapParams.fromAmount,
        fromTokenInfo.decimals
      );

      // 1. Get quote
      console.log("Getting quote for limit order...");
      const { data: quoteRes } = await axios.post(`${baseUrl}/api/quote`, {
        fromChainId: swapParams.fromChainId,
        toChainId: swapParams.toChainId,
        srcToken: fromTokenInfo.address,
        dstToken: toTokenInfo.address,
        amount: fromAmountWei,
        walletAddress: address,
      });
      if (!quoteRes.success) throw new Error("Failed to fetch quote");
      const quote = quoteRes.data;

      // 2. Create limit order
      console.log("Creating limit order...");
      const { data: orderRes } = await axios.post(
        `${baseUrl}/api/orders/create`,
        {
          fromChainId: swapParams.fromChainId,
          toChainId: swapParams.toChainId,
          srcToken: fromTokenInfo.address,
          dstToken: toTokenInfo.address,
          amount: fromAmountWei,
          walletAddress: address,
          preset: quote.recommendedPreset || "fast",
        }
      );
      if (!orderRes.success) throw new Error("Failed to create limit order");

      const {
        order,
        verifyingContract,
        extension,
        quoteId,
        secretHashes,
        srcChainId,
        domain,
        types,
      } = orderRes.data;

      // 3. Ask wallet to sign order (this will trigger wallet popup)
      console.log("Requesting wallet signature for limit order...");

      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: "Order",
        message: order,
      });

      // 4. Submit signed order
      console.log("Submitting signed limit order...");
      const { data: submitRes } = await axios.post(
        `${baseUrl}/api/orders/submit`,
        {
          order,
          srcChainId,
          signature,
          extension,
          quoteId,
          secretHashes,
        }
      );
      if (!submitRes.success) throw new Error("Failed to submit limit order");

      setLimitOrderSuccess(true);
      console.log("Limit order executed successfully!", submitRes.data);
    } catch (error: any) {
      console.error("Limit order execution error:", error);
      setLimitOrderError(error.message || "Failed to execute limit order");
    } finally {
      setIsExecutingLimitOrder(false);
    }
  }

  const handleConnectWallet = () => {
    setShowWalletOptions(true);
    setShowConnectionDialog(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-balance">1inch swapp</h1>
            <p className="text-muted-foreground">
              make sure no one&apos;s watching you
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Badge variant="outline" className="gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Connected
              </Badge>
              <WalletStatsDropdown />
            </>
          ) : (
            <Button onClick={handleConnectWallet} className="gap-2">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trading Interface */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            {!isConnected ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Connect your wallet to start trading cryptocurrencies with
                  instant swaps and limit orders.
                </p>
                <Button
                  onClick={handleConnectWallet}
                  size="lg"
                  className="gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <Tabs
                value={swapMode}
                onValueChange={(value) =>
                  setSwapMode(value as "instant" | "limit")
                }
              >
                <div className="flex items-center justify-between mb-6">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="instant" className="gap-2">
                      <Zap className="w-4 h-4" />
                      Instant Swap
                    </TabsTrigger>
                    <TabsTrigger value="limit" className="gap-2">
                      <Clock className="w-4 h-4" />
                      Limit Order
                    </TabsTrigger>
                  </TabsList>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>

                <TabsContent value="instant" className="space-y-4">
                  {/* From Token */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">From (Base)</label>
                      <span className="text-xs text-muted-foreground">
                        Balance:{" "}
                        {balanceLoading
                          ? "Loading..."
                          : formatBalanceForDisplay(balance)}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={swapParams.fromAmount}
                        onChange={(e) =>
                          updateSwapParams({ fromAmount: e.target.value })
                        }
                        className="text-2xl font-mono h-16 pr-32"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <TokenSelector
                          selectedToken={swapParams.fromToken}
                          onTokenSelect={(token) =>
                            updateSwapParams({ fromToken: token })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSwapTokens}
                      className="rounded-full w-10 h-10 p-0 bg-transparent"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* To Token */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        To (Polygon)
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {swapParams.fromToken === "USDC" &&
                        swapParams.fromAmount
                          ? `${swapParams.fromAmount} ${swapParams.toToken}`
                          : quote && quote.toToken
                          ? `${quote.toToken.amount} ${quote.toToken.symbol}`
                          : "0.00"}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={
                          swapParams.fromToken === "USDC" &&
                          swapParams.fromAmount
                            ? swapParams.fromAmount
                            : quote?.toToken?.amount || ""
                        }
                        readOnly
                        className="text-2xl font-mono h-16 pr-32 bg-muted/50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <TokenSelector
                          selectedToken={swapParams.toToken}
                          onTokenSelect={(token) =>
                            updateSwapParams({ toToken: token })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quote Loading/Error States */}
                  {isLoadingQuote && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Getting quote...
                      </span>
                    </div>
                  )}

                  {quoteError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">{quoteError}</span>
                    </div>
                  )}

                  {/* Swap Details */}
                  {quote && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rate</span>
                        <span className="font-mono">
                          1 Base {quote?.fromToken?.symbol || "Token"} ={" "}
                          {exchangeRate?.toFixed(6)} Polygon{" "}
                          {quote?.toToken?.symbol || "Token"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Slippage</span>
                        <span className="font-mono">{slippage}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Price Impact
                        </span>
                        <span className="font-mono">
                          {priceImpact?.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Estimated Gas
                        </span>
                        <span className="font-mono">
                          {estimatedGas || "N/A"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Execution States */}
                  {executionError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">
                        {executionError}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetExecution}
                        className="ml-auto"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {executionSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-green-700 font-medium">
                          Swap executed successfully!
                        </span>
                        {orderHash && (
                          <div className="text-xs text-green-600 font-mono mt-1">
                            Order: {orderHash.slice(0, 10)}...
                            {orderHash.slice(-8)}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetExecution}
                        className="ml-auto"
                      >
                        New Swap
                      </Button>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 text-lg font-semibold"
                    disabled={!canSwap}
                    onClick={executeSwap}
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Executing Swap...
                      </>
                    ) : isLoadingQuote ? (
                      "Getting Quote..."
                    ) : (
                      "Swap Tokens"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="limit" className="space-y-4">
                  {/* Limit Order Interface */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        You Pay (Base)
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={swapParams.fromAmount}
                          onChange={(e) =>
                            updateSwapParams({ fromAmount: e.target.value })
                          }
                          className="font-mono h-12 pr-20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <TokenSelector
                            selectedToken={swapParams.fromToken}
                            onTokenSelect={(token) =>
                              updateSwapParams({ fromToken: token })
                            }
                            compact
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        You Receive (Polygon)
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={
                            swapParams.fromToken === "USDC" &&
                            swapParams.fromAmount
                              ? swapParams.fromAmount
                              : quote?.toToken?.amount || ""
                          }
                          readOnly
                          className="font-mono h-12 pr-20 bg-muted/50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <TokenSelector
                            selectedToken={swapParams.toToken}
                            onTokenSelect={(token) =>
                              updateSwapParams({ toToken: token })
                            }
                            compact
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Limit Price</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="2,450.00"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="font-mono h-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        Polygon USDC per Base USDC
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order Type</label>
                    <Select defaultValue="good-till-cancelled">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good-till-cancelled">
                          Good Till Cancelled
                        </SelectItem>
                        <SelectItem value="immediate-or-cancel">
                          Immediate or Cancel
                        </SelectItem>
                        <SelectItem value="fill-or-kill">
                          Fill or Kill
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Current Price
                      </span>
                      <span className="font-mono">1.00 Polygon USDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Price Difference
                      </span>
                      <span className="font-mono text-green-600">+0.00%</span>
                    </div>
                  </div>

                  {/* Execution States */}
                  {limitOrderError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">
                        {limitOrderError}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLimitOrderError(null)}
                        className="ml-auto"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {limitOrderSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-green-700 font-medium">
                          Limit order placed successfully!
                        </span>
                        <div className="text-xs text-green-600 font-mono mt-1">
                          Your order has been submitted and is waiting for
                          execution.
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLimitOrderSuccess(false)}
                        className="ml-auto"
                      >
                        New Order
                      </Button>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 text-lg font-semibold"
                    disabled={!canSwap || isExecutingLimitOrder}
                    onClick={executeLimitOrder}
                  >
                    {isExecutingLimitOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Executing Limit Order...
                      </>
                    ) : isLoadingQuote ? (
                      "Getting Quote..."
                    ) : (
                      "Place Limit Order"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </Card>

          {/* Price Chart */}
          {isConnected && <PriceChart />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Market Stats */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" />
              <h3 className="font-semibold">Market Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  24h Volume
                </span>
                <span className="text-sm font-mono">$2.4B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  24h Change
                </span>
                <span className="text-sm font-mono text-green-600">+2.45%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">TVL</span>
                <span className="text-sm font-mono">$1.2B</span>
              </div>
            </div>
          </Card>

          {/* Order Book */}
          {isConnected && <OrderBook />}

          {/* Recent Trades */}
          {isConnected && <RecentTrades />}
        </div>
      </div>

      <WalletConnectionDialog
        open={showConnectionDialog}
        onOpenChange={(open) => {
          setShowConnectionDialog(open);
          if (!open) setShowWalletOptions(false);
        }}
        walletAddress={address!}
      />
    </div>
  );
}
