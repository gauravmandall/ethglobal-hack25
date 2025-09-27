import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { body, param, validationResult } from "express-validator";
import axios, { type AxiosResponse } from "axios";
import { ethers } from "ethers";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

interface CancelOrderBody {
  privateKey: string;
}

interface CreateOrderRequest {
  fromChainId: number | string;
  toChainId: number | string;
  srcToken: string;
  dstToken: string;
  amount: string;
  walletAddress: string;
  permit?: string;
  isPermit2?: boolean;
  receiver?: string;
  preset?: string;
}

interface SubmitOrderRequest {
  order: any;
  srcChainId: number;
  signature: string;
  extension?: string;
  quoteId: string;
  secretHashes: string[];
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

class OneInchFusionService {
  private apiKey: string;
  public baseUrl: string;
  private providers: Map<string, ethers.JsonRpcProvider>;
  private wallets: Map<string, ethers.Wallet>;

  constructor() {
    this.apiKey = process.env.ONEINCH_API_KEY || "";
    this.baseUrl = "https://api.1inch.dev";
    this.providers = new Map();
    this.wallets = new Map();

    if (!this.apiKey) {
      throw new Error("ONEINCH_API_KEY environment variable is required");
    }
  }

  private getRpcUrl(chainId: string): string {
    const rpcUrls: Record<string, string> = {
      "1":
        process.env.ETH_RPC_URL ||
        "https://ethereum.rpc.subquery.network/public",
      "137":
        process.env.POLYGON_RPC_URL ||
        "https://polygon.rpc.subquery.network/public",
      "42161":
        process.env.ARBITRUM_RPC_URL ||
        "https://arbitrum.rpc.subquery.network/public",
      // add base
      "8453":
        process.env.BASE_RPC_URL || "https://base.rpc.subquery.network/public",
    };
    return rpcUrls[chainId] || (rpcUrls["1"] as string);
  }

  getProvider(chainId: string): ethers.JsonRpcProvider {
    if (!this.providers.has(chainId)) {
      const rpcUrl = this.getRpcUrl(chainId);
      this.providers.set(chainId, new ethers.JsonRpcProvider(rpcUrl));
    }
    return this.providers.get(chainId)!;
  }

  getWallet(privateKey: string, chainId: string): ethers.Wallet {
    const key = `${privateKey}-${chainId}`;
    if (!this.wallets.has(key)) {
      const provider = this.getProvider(chainId);
      this.wallets.set(key, new ethers.Wallet(privateKey, provider));
    }
    return this.wallets.get(key)!;
  }

  async getQuote(params: {
    fromChainId: string;
    toChainId: string;
    srcToken: string;
    dstToken: string;
    walletAddress: string;
    amount: string;
  }): Promise<any> {
    const url = `${this.baseUrl}/fusion-plus/quoter/v1.1/quote/receive`;

    console.log(`🔍 Getting quote from ${url}`);
    console.log(`📋 Quote params:`, {
      srcChain: params.fromChainId,
      dstChain: params.toChainId,
      srcToken: params.srcToken,
      dstToken: params.dstToken,
      walletAddress: params.walletAddress,
      amount: params.amount,
    });

    try {
      const response: AxiosResponse = await axios.get(url, {
        params: {
          srcChain: params.fromChainId,
          dstChain: params.toChainId,
          srcTokenAddress: params.srcToken,
          dstTokenAddress: params.dstToken,
          walletAddress: params.walletAddress,
          amount: params.amount,
          enableEstimate: true,
          fee: "0",
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      console.log(`✅ Quote response status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Quote API error:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        params: error.config?.params,
      });

      // Enhanced error handling for token support issues
      if (
        error.response?.status === 400 &&
        error.response?.data?.description === "token not supported"
      ) {
        const enhancedError = new Error(
          `Token not supported: ${params.srcToken} on chain ${params.fromChainId} or ${params.dstToken} on chain ${params.toChainId}. ` +
            `Please check if these tokens are supported by 1inch Fusion+ for cross-chain swaps.`
        );
        enhancedError.name = "TokenNotSupportedError";
        throw enhancedError;
      }

      throw error;
    }
  }

  async buildLimitOrder(params: {
    quoteId: string;
    secretsHashList: string[];
    permit?: string;
    isPermit2?: boolean;
    receiver?: string;
    preset?: string;
  }): Promise<any> {
    const url = `${this.baseUrl}/fusion-plus/quoter/v1.1/quote/build/evm`;

    console.log(`🔨 Building limit order from ${url}`);
    console.log(`📋 Build order params:`, {
      quoteId: params.quoteId,
      secretsHashList: params.secretsHashList,
      //   permit: params.permit,
      //   isPermit2: params.isPermit2,
      //   receiver: params.receiver,
      preset: params.preset,
    });

    try {
      const response: AxiosResponse = await axios.post(
        url,
        {
          secretsHashList: params.secretsHashList,
          permit: params.permit,
          isPermit2: params.isPermit2 || false,
          receiver: params.receiver,
          preset: params.preset || "fast",
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          params: {
            quoteId: params.quoteId,
          },
          paramsSerializer: {
            indexes: null,
          },
          timeout: 30000,
        }
      );

      console.log(`✅ Build order response status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Build order API error:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: JSON.stringify(error.response?.data),
        url: error.config?.url,
        params: error.config?.params,
      });
      throw error;
    }
  }

  async signOrder(
    orderData: any,
    privateKey: string,
    chainId: string
  ): Promise<any> {
    const wallet = this.getWallet(privateKey, chainId);

    const domain = {
      name: "1inch Fusion+",
      version: "1",
      chainId: parseInt(chainId),
      verifyingContract: orderData.verifyingContract,
    };

    const types = {
      Order: [
        { name: "salt", type: "uint256" },
        { name: "maker", type: "address" },
        { name: "receiver", type: "address" },
        { name: "makerAsset", type: "address" },
        { name: "takerAsset", type: "address" },
        { name: "makingAmount", type: "uint256" },
        { name: "takingAmount", type: "uint256" },
        { name: "makerTraits", type: "uint256" },
      ],
    };

    const signature = await wallet.signTypedData(
      domain,
      types,
      orderData.order
    );
    return { ...orderData, signature };
  }

  async submitOrder(orderData: {
    order: any;
    srcChainId: number;
    signature: string;
    extension?: string;
    quoteId?: string;
    secretHashes?: string[];
  }): Promise<any> {
    const url = `${this.baseUrl}/fusion-plus/relayer/v1.1/submit`;

    // Structure the order according to the API schema
    const evmSignedOrderInput = {
      order: orderData.order,
      srcChainId: orderData.srcChainId,
      signature: orderData.signature,
      extension: orderData.extension || "0x",
      quoteId: orderData.quoteId || "",
      secretHashes: orderData.secretHashes || [],
    };

    console.log(`📤 Submitting order to ${url}`);
    console.log(`📋 Submit order data:`, {
      srcChainId: evmSignedOrderInput.srcChainId,
      quoteId: evmSignedOrderInput.quoteId,
      secretHashes: evmSignedOrderInput.secretHashes,
      extension: evmSignedOrderInput.extension,
    });

    try {
      const response: AxiosResponse = await axios.post(
        url,
        evmSignedOrderInput,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log(`✅ Submit order response status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Submit order API error:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  }

  async getOrderStatus(orderHash: string, chainId: string): Promise<any> {
    const url = `${this.baseUrl}/fusion-plus/relayer/v1.1/${chainId}/order/status/${orderHash}`;

    const response: AxiosResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  }

  async cancelOrder(
    orderHash: string,
    chainId: string,
    privateKey: string
  ): Promise<any> {
    const url = `${this.baseUrl}/fusion-plus/relayer/v1.0/${chainId}/order/cancel`;

    const wallet = this.getWallet(privateKey, chainId);
    const message = ethers.solidityPackedKeccak256(["bytes32"], [orderHash]);
    const signature = await wallet.signMessage(ethers.getBytes(message));

    const response: AxiosResponse = await axios.post(
      url,
      { orderHash, signature },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  }

  async getActiveOrders(
    maker: string,
    chainId: string,
    limit = 10,
    offset = 0
  ): Promise<any> {
    const url = `${this.baseUrl}/fusion-plus/relayer/v1.0/${chainId}/order/active`;

    const response: AxiosResponse = await axios.get(url, {
      params: { maker, limit, offset },
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async getBalances(chainId: string, walletAddress: string): Promise<any> {
    const url = `${this.baseUrl}/balance/v1.2/${chainId}/balances/${walletAddress}`;
    const response: AxiosResponse = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  generateSalt(): string {
    return ethers.getBigInt(ethers.hexlify(ethers.randomBytes(32))).toString();
  }

  async checkTokenSupport(
    chainId: string,
    tokenAddress: string
  ): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/swap/v6.0/${chainId}/tokens`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      const tokens = response.data?.tokens || {};
      return !!tokens[tokenAddress.toLowerCase()];
    } catch (error) {
      console.error(
        `❌ Token support check failed for ${tokenAddress} on chain ${chainId}:`,
        error
      );
      return false;
    }
  }

  async validateTokenPair(params: {
    fromChainId: string;
    toChainId: string;
    srcToken: string;
    dstToken: string;
  }): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check source token support
    const srcTokenSupported = await this.checkTokenSupport(
      params.fromChainId,
      params.srcToken
    );
    if (!srcTokenSupported) {
      errors.push(
        `Source token ${params.srcToken} is not supported on chain ${params.fromChainId}`
      );
    }

    // Check destination token support
    const dstTokenSupported = await this.checkTokenSupport(
      params.toChainId,
      params.dstToken
    );
    if (!dstTokenSupported) {
      errors.push(
        `Destination token ${params.dstToken} is not supported on chain ${params.toChainId}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Init service
const fusionService = new OneInchFusionService();

// Validation middleware
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array(),
    });
  }
  next();
};

const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("🚨 API Error:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle axios errors specifically
  if (error.isAxiosError) {
    console.error("🌐 Axios Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        data: error.config?.data,
      },
    });

    return res.status(error.response?.status || 500).json({
      success: false,
      message: "External API error",
      error: {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      },
    });
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.message,
    });
  }

  // Handle token not supported errors
  if (error.name === "TokenNotSupportedError") {
    return res.status(400).json({
      success: false,
      message: "Token not supported",
      error: error.message,
      suggestion:
        "Use the /api/validate-tokens endpoint to check token support before requesting quotes",
    });
  }

  // Generic error handler
  res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

app.use(errorHandler);

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: {
      hasApiKey: !!process.env.ONEINCH_API_KEY,
      nodeEnv: process.env.NODE_ENV || "development",
    },
  });
});

// Test endpoint to verify 1inch API connectivity
app.get("/api/test-connection", async (req: Request, res: Response) => {
  try {
    console.log("🧪 Testing 1inch API connection...");

    // Test with a simple token list request
    const testUrl = `${fusionService.baseUrl}/swap/v6.0/1/tokens`;
    console.log(`🔗 Testing connection to: ${testUrl}`);

    const response = await axios.get(testUrl, {
      headers: {
        Authorization: `Bearer ${fusionService["apiKey"]}`,
      },
      timeout: 10000, // 10 second timeout for test
    });

    res.json({
      success: true,
      message: "1inch API connection successful",
      data: {
        status: response.status,
        tokensCount: response.data?.tokens
          ? Object.keys(response.data.tokens).length
          : 0,
        url: testUrl,
      },
    });
  } catch (error: any) {
    console.error("❌ 1inch API connection test failed:", error.message);
    res.status(500).json({
      success: false,
      message: "1inch API connection test failed",
      error: {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
      },
    });
  }
});

app.post(
  "/api/validate-tokens",
  [
    body("fromChainId").isNumeric(),
    body("toChainId").isNumeric(),
    body("srcToken").isEthereumAddress(),
    body("dstToken").isEthereumAddress(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fromChainId, toChainId, srcToken, dstToken } = req.body;

      const validation = await fusionService.validateTokenPair({
        fromChainId: fromChainId.toString(),
        toChainId: toChainId.toString(),
        srcToken,
        dstToken,
      });

      res.json({
        success: true,
        data: {
          isValid: validation.isValid,
          errors: validation.errors,
          tokens: {
            srcToken: { address: srcToken, chainId: fromChainId },
            dstToken: { address: dstToken, chainId: toChainId },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/quote",
  [
    body("fromChainId").isNumeric(),
    body("toChainId").isNumeric(),
    body("srcToken").isEthereumAddress(),
    body("dstToken").isEthereumAddress(),
    body("amount").isString(),
    body("walletAddress").isEthereumAddress(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        fromChainId,
        toChainId,
        srcToken,
        dstToken,
        amount,
        walletAddress,
      } = req.body;

      // Optional: Validate tokens before attempting quote
      // Uncomment the following lines to enable pre-validation
      /*
      const validation = await fusionService.validateTokenPair({
        fromChainId: fromChainId.toString(),
        toChainId: toChainId.toString(),
        srcToken,
        dstToken,
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Token validation failed",
          errors: validation.errors
        });
      }
      */

      const quote = await fusionService.getQuote({
        fromChainId: fromChainId.toString(),
        toChainId: toChainId.toString(),
        srcToken,
        dstToken,
        walletAddress,
        amount,
      });
      res.json({ success: true, data: quote });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/orders/create",
  [
    body("fromChainId").isNumeric().withMessage("fromChainId must be a number"),
    body("toChainId").isNumeric().withMessage("toChainId must be a number"),
    body("srcToken")
      .isEthereumAddress()
      .withMessage("Invalid source token address"),
    body("dstToken")
      .isEthereumAddress()
      .withMessage("Invalid destination token address"),
    body("amount").isString().withMessage("Amount must be a string"),
    body("walletAddress")
      .isEthereumAddress()
      .withMessage("Wallet address is required"),
    body("permit").optional().isString(),
    body("isPermit2").optional().isBoolean(),
    body("receiver").optional().isString(),
    body("preset").optional().isString(),
    handleValidationErrors,
  ],
  async (
    req: Request<{}, any, CreateOrderRequest>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        fromChainId,
        toChainId,
        srcToken,
        dstToken,
        amount,
        walletAddress,
        permit,
        isPermit2,
        receiver,
        preset,
      } = req.body;

      const fromChainStr = String(fromChainId);

      const quote = await fusionService.getQuote({
        fromChainId: fromChainStr,
        toChainId: String(toChainId),
        srcToken,
        dstToken,
        walletAddress,
        amount,
      });

      if (!quote.quoteId) {
        throw new Error("No quoteId received from quote API");
      }

      // Extract secretsCount from the quote response based on preset
      const selectedPreset = preset || quote.recommendedPreset || "fast";
      const secretsCount = quote.presets[selectedPreset]?.secretsCount || 5;

      // Generate secrets hash array with the required number of elements
      const secretsHashList = Array.from(
        { length: secretsCount },
        (_, index) => {
          // Generate a random 32-byte hash for each secret
          const randomBytes = crypto.randomBytes(32);
          return "0x" + randomBytes.toString("hex");
        }
      );

      const order = await fusionService.buildLimitOrder({
        quoteId: quote.quoteId,
        secretsHashList,
        permit,
        isPermit2,
        receiver,
        preset,
      });

      res.json({
        success: true,
        message: "Order created successfully - ready for signing",
        data: {
          order: order.order,
          verifyingContract: order.verifyingContract,
          extension: order.extension,
          quoteId: quote.quoteId,
          secretHashes: secretsHashList,
          srcChainId: parseInt(fromChainStr),
          domain: {
            name: "1inch Fusion+",
            version: "1",
            chainId: parseInt(fromChainStr),
            verifyingContract: order.verifyingContract,
          },
          types: {
            Order: [
              { name: "salt", type: "uint256" },
              { name: "maker", type: "address" },
              { name: "receiver", type: "address" },
              { name: "makerAsset", type: "address" },
              { name: "takerAsset", type: "address" },
              { name: "makingAmount", type: "uint256" },
              { name: "takingAmount", type: "uint256" },
              { name: "makerTraits", type: "uint256" },
            ],
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/orders/submit",
  [
    body("order").isObject().withMessage("Order data is required"),
    body("srcChainId").isNumeric().withMessage("srcChainId must be a number"),
    body("signature").isString().withMessage("Signature is required"),
    body("extension").optional().isString(),
    body("quoteId").isString().withMessage("Quote ID is required"),
    body("secretHashes")
      .isArray()
      .withMessage("Secret hashes array is required"),
    handleValidationErrors,
  ],
  async (
    req: Request<{}, any, SubmitOrderRequest>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { order, srcChainId, signature, extension, quoteId, secretHashes } =
        req.body;

      // Submit the signed order
      const result = await fusionService.submitOrder({
        order,
        srcChainId,
        signature,
        extension,
        quoteId,
        secretHashes,
      });

      res.json({
        success: true,
        message: "Signed order submitted successfully",
        data: {
          orderHash: result.orderHash,
          order,
          signature,
          quoteId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/orders/:orderHash/:chainId",
  [
    param("orderHash").isHexadecimal().withMessage("Invalid order hash"),
    param("chainId").isNumeric().withMessage("Chain ID must be a number"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderHash, chainId } = req.params;

      const status = await fusionService.getOrderStatus(
        orderHash as string,
        chainId as string
      );

      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/orders/:orderHash/:chainId",
  [
    param("orderHash").isHexadecimal().withMessage("Invalid order hash"),
    param("chainId").isNumeric().withMessage("Chain ID must be a number"),
    body("privateKey").isString().withMessage("Private key is required"),
    handleValidationErrors,
  ],
  async (
    req: Request<any, CancelOrderBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderHash, chainId } = req.params;
      const { privateKey } = req.body;

      const result = await fusionService.cancelOrder(
        orderHash,
        chainId,
        privateKey
      );

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/orders/active/:maker/:chainId",
  [
    param("maker").isEthereumAddress().withMessage("Invalid maker address"),
    param("chainId").isNumeric().withMessage("Chain ID must be a number"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { maker, chainId } = req.params;
      const limit = Number(req.query.limit ?? 10);
      const offset = Number(req.query.offset ?? 0);

      const orders = await fusionService.getActiveOrders(
        maker!,
        chainId!,
        limit,
        offset
      );

      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/tokens/:chainId",
  [
    param("chainId").isNumeric().withMessage("Chain ID must be a number"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chainId } = req.params;
      const url = `${fusionService.baseUrl}/swap/v6.0/${chainId}/tokens`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${fusionService["apiKey"]}`,
        },
      });

      res.json({ success: true, data: response.data });
    } catch (error) {
      next(error);
    }
  }
);

// Common token addresses for testing
app.get("/api/common-tokens", (req: Request, res: Response) => {
  const commonTokens = {
    "1": {
      // Ethereum
      WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
    },
    "137": {
      // Polygon
      WMATIC: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      USDT: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      DAI: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    },
    "8453": {
      // Base
      WETH: "0x4200000000000000000000000000000000000006",
      USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      DAI: "0x50c5725949a6f0c72e6c4a641f24049a917db0cb",
    },
    "42161": {
      // Arbitrum
      WETH: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      USDC: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
      USDT: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      DAI: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    },
  };

  res.json({
    success: true,
    data: {
      message: "Common token addresses for testing",
      tokens: commonTokens,
      note: "These are common token addresses. Use /api/tokens/:chainId to get the full list of supported tokens.",
    },
  });
});

app.post(
  "/api/utils/to-wei",
  [
    body("amount").isString().withMessage("Amount must be a string"),
    body("decimals")
      .optional()
      .isNumeric()
      .withMessage("Decimals must be a number"),
    handleValidationErrors,
  ],
  (req: Request, res: Response) => {
    try {
      const { amount, decimals = 18 } = req.body;
      const wei = ethers.parseUnits(amount, Number(decimals)).toString();

      res.json({
        success: true,
        data: { amount, decimals, wei },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

app.post(
  "/api/utils/from-wei",
  [
    body("wei").isString().withMessage("Wei must be a string"),
    body("decimals")
      .optional()
      .isNumeric()
      .withMessage("Decimals must be a number"),
    handleValidationErrors,
  ],
  (req: Request, res: Response) => {
    try {
      const { wei, decimals = 18 } = req.body;
      const amount = ethers.formatUnits(wei, Number(decimals));

      res.json({
        success: true,
        data: { wei, decimals, amount },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`🚀 1inch Fusion+ API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API Base URL: http://localhost:${PORT}/api`);
});

export default app;
