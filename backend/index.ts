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
}
