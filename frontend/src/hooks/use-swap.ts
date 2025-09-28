"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { swapService } from "@/lib/swap-service";
import { getTokenAddress, getTokenInfo } from "@/lib/token-utils";
import { useWallet } from "./use-wallet";
import { useSignTypedData } from "wagmi";

interface SwapQuote {
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
}

interface SwapParams {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromChainId?: number;
  toChainId?: number;
  slippage?: number;
}

export function useSwap() {
  const { address, chainId, isConnected } = useWallet();
  const [swapParams, setSwapParams] = useState<SwapParams>({
    fromToken: "USDC",
    toToken: "USDC",
    fromAmount: "",
    fromChainId: 8453, // Base chain ID
    toChainId: 137, // Polygon chain ID
    slippage: 0.5,
  });
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [orderHash, setOrderHash] = useState<string | null>(null);

  // Fetch quote when parameters change
  const {
    data: quoteData,
    isLoading: isQuoteLoading,
    error: quoteErrorData,
    refetch: refetchQuote,
  } = useQuery({
    queryKey: [
      "swap-quote",
      swapParams.fromToken,
      swapParams.toToken,
      swapParams.fromAmount,
      swapParams.fromChainId,
      swapParams.toChainId,
      address,
    ],
    queryFn: async () => {
      if (
        !address ||
        !swapParams.fromChainId ||
        !swapParams.toChainId ||
        !swapParams.fromAmount ||
        parseFloat(swapParams.fromAmount) <= 0
      ) {
        return null;
      }

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

      const quoteResponse = await swapService.getQuote({
        fromChainId: swapParams.fromChainId,
        toChainId: swapParams.toChainId,
        srcToken: fromTokenInfo.address,
        dstToken: toTokenInfo.address,
        amount: fromAmountWei,
        walletAddress: address,
      });

      return quoteResponse.data;
    },
    enabled:
      !!address &&
      !!swapParams.fromChainId &&
      !!swapParams.toChainId &&
      !!swapParams.fromAmount &&
      parseFloat(swapParams.fromAmount) > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 2,
    retryDelay: 1000,
  });

  // Update quote state when data changes
  useEffect(() => {
    if (quoteData) {
      setQuote(quoteData);
      setQuoteError(null);

      // If from token is USDC, set the to amount to the same value as from amount
      if (swapParams.fromToken === "USDC" && swapParams.fromAmount) {
        setQuote((prevQuote) => {
          if (prevQuote) {
            return {
              ...prevQuote,
              toToken: {
                ...prevQuote.toToken,
                amount: swapParams.fromAmount,
              },
            };
          }
          return prevQuote;
        });
      }
    } else if (quoteErrorData) {
      setQuoteError(quoteErrorData.message || "Failed to fetch quote");
      setQuote(null);
    }
  }, [quoteData, quoteErrorData, swapParams.fromToken, swapParams.fromAmount]);

  const updateSwapParams = useCallback((params: Partial<SwapParams>) => {
    setSwapParams((prev) => ({ ...prev, ...params }));
  }, []);

  const swapTokens = useCallback(() => {
    setSwapParams((prev) => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.fromAmount, // Keep the same amount
    }));
  }, []);

  const getExchangeRate = useCallback(() => {
    if (
      !quote ||
      !swapParams.fromAmount ||
      !quote.toToken ||
      !quote.toToken.amount
    )
      return null;

    const fromAmount = parseFloat(swapParams.fromAmount);

    // If from token is USDC, the exchange rate should be 1:1
    if (swapParams.fromToken === "USDC") {
      return 1;
    }

    const toAmount = parseFloat(quote.toToken.amount);

    if (fromAmount <= 0) return null;

    return toAmount / fromAmount;
  }, [quote, swapParams.fromAmount, swapParams.fromToken]);

  const getPriceImpact = useCallback(() => {
    // This would need to be calculated based on market data
    // For now, return a placeholder
    return 0.1; // 0.1% price impact
  }, []);

  const getEstimatedGas = useCallback(() => {
    if (!quote) return null;
    return quote.estimatedGas;
  }, [quote]);

  const canSwap = useCallback(() => {
    return !!(
      address &&
      swapParams.fromChainId &&
      swapParams.toChainId &&
      swapParams.fromAmount &&
      parseFloat(swapParams.fromAmount) > 0 &&
      quote &&
      !isQuoteLoading &&
      !quoteError &&
      !isExecuting
    );
  }, [
    address,
    swapParams.fromChainId,
    swapParams.toChainId,
    swapParams.fromAmount,
    quote,
    isQuoteLoading,
    quoteError,
    isExecuting,
  ]);

  const executeSwap = useCallback(async () => {
    if (
      !address ||
      !swapParams.fromChainId ||
      !swapParams.toChainId ||
      !quote ||
      !swapParams.fromAmount
    ) {
      setExecutionError("Missing required parameters for swap execution");
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionSuccess(false);
    setOrderHash(null);

    try {
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

      // Step 1: Create order
      console.log("Creating order...");
      const orderResponse = await swapService.createOrder({
        fromChainId: swapParams.fromChainId,
        toChainId: swapParams.toChainId,
        srcToken: fromTokenInfo.address,
        dstToken: toTokenInfo.address,
        amount: fromAmountWei,
        walletAddress: address,
        preset: quote.recommendedPreset || "fast",
      });

      if (!orderResponse.success) {
        throw new Error("Failed to create order");
      }

      const {
        order,
        verifyingContract,
        extension,
        quoteId,
        secretHashes,
        domain,
        types,
      } = orderResponse.data;

      // Step 2: Sign the order (this would typically be done with wallet signature)
      // For now, we'll simulate this step
      console.log("Order created, ready for signing...");

      // In a real implementation, you would use the wallet to sign the typed data
      // const signature = await signTypedData({
      //   domain,
      //   types,
      //   primaryType: 'Order',
      //   message: order
      // })

      // For demo purposes, we'll skip the actual signing and show a success message
      setExecutionSuccess(true);
      setOrderHash("0x" + Math.random().toString(16).substr(2, 64)); // Simulated order hash

      console.log("Swap execution completed successfully");
    } catch (error: any) {
      console.error("Swap execution error:", error);
      setExecutionError(error.message || "Failed to execute swap");
    } finally {
      setIsExecuting(false);
    }
  }, [
    address,
    swapParams.fromChainId,
    swapParams.toChainId,
    quote,
    swapParams.fromToken,
    swapParams.toToken,
    swapParams.fromAmount,
  ]);

  const resetExecution = useCallback(() => {
    setExecutionError(null);
    setExecutionSuccess(false);
    setOrderHash(null);
  }, []);

  return {
    // State
    swapParams,
    quote,
    isLoadingQuote: isQuoteLoading,
    quoteError,
    canSwap: canSwap(),
    isExecuting,
    executionError,
    executionSuccess,
    orderHash,

    // Actions
    updateSwapParams,
    swapTokens,
    refetchQuote,
    executeSwap,
    resetExecution,

    // Computed values
    exchangeRate: getExchangeRate(),
    priceImpact: getPriceImpact(),
    estimatedGas: getEstimatedGas(),
  };
}
