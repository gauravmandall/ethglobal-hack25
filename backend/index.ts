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

// Routes
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});
