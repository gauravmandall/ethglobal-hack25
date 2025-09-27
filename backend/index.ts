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
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

class OneInchFusionService {
  private apiKey: string;
  private baseUrl: string;
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
      "56":
        process.env.BSC_RPC_URL || "https://bsc.rpc.subquery.network/public",
      "42161":
        process.env.ARBITRUM_RPC_URL ||
        "https://arbitrum.rpc.subquery.network/public",
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
    amount: string;
  }): Promise<any> {
    const url = `${this.baseUrl}/fusion-plus/quoter/v1.0/${params.fromChainId}/quote`;

    const response: AxiosResponse = await axios.get(url, {
      params: {
        srcToken: params.srcToken,
        dstToken: params.dstToken,
        amount: params.amount,
        dstChainId: params.toChainId,
        enableEstimate: true,
        fee: "0",
      },
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  }

  async buildLimitOrder(params: any): Promise<any> {
    const url = `${this.baseUrl}/fusion-plus/relayer/v1.0/${params.fromChainId}/order/build`;

    const response: AxiosResponse = await axios.post(
      url,
      {
        makerAsset: params.makerAsset,
        takerAsset: params.takerAsset,
        maker: params.maker,
        allowedSender: params.allowedSender || ethers.ZeroAddress,
        makingAmount: params.makingAmount,
        takingAmount: params.takingAmount,
        expiration: params.expiration,
        salt: params.salt,
        interactions: "0x",
        permit: "0x",
        preInteraction: "0x",
        postInteraction: "0x",
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
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

// Error handler
const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("API Error:", error);
  if (error.response?.data) {
    return res.status(error.response.status || 500).json({
      success: false,
      message: "External API error",
      error: error.response.data,
    });
  }
  res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
};

app.use(errorHandler);

// Routes
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.post(
  "/api/quote",
  [
    body("fromChainId").isNumeric(),
    body("toChainId").isNumeric(),
    body("srcToken").isEthereumAddress(),
    body("dstToken").isEthereumAddress(),
    body("amount").isString(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fromChainId, toChainId, srcToken, dstToken, amount } = req.body;
      const quote = await fusionService.getQuote({
        fromChainId: fromChainId.toString(),
        toChainId: toChainId.toString(),
        srcToken,
        dstToken,
        amount,
      });
      res.json({ success: true, data: quote });
    } catch (error) {
      next(error);
    }
  }
);

app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 1inch Fusion+ API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API Base URL: http://localhost:${PORT}/api`);
});

export default app;
