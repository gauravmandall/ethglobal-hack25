# Cross-Chain Token Swap Protocol

## Overview

This project is a full-stack cross-chain protocol enabling seamless token swaps across multiple blockchains. It features a robust backend, a modern frontend, and smart contract integration, designed for scalability, security, and user experience. The protocol is built for ETHGlobal Hackathon 2025 and aims to push the boundaries of interoperability in decentralized finance (DeFi).

## Features

- **Cross-Chain Token Swaps:** Swap tokens between different blockchains with a single interface.
- **Secure Order Management:** Backend APIs for creating, submitting, and cancelling swap orders, with validation and rate limiting.
- **Wallet Integration:** Connect your wallet and manage assets directly from the frontend.
- **Modern UI:** Built with Next.js and Tailwind CSS for a fast, responsive, and intuitive user experience.
- **Smart Contract Layer:** NEAR contract template for on-chain state management and extensibility.

## Architecture

- **Backend (`backend/`):**
  - Node.js (Express) API server
  - Bun runtime for speed and efficiency
  - Handles order lifecycle, validation, and cross-chain logic

- **Frontend (`frontend/`):**
  - Next.js app with modular components
  - Wallet connection, swap interface, order book, price chart, and more
  - Tailwind CSS for styling

- **Smart Contract (`near-cross-chain-protocol/`):**
  - NEAR contract written in TypeScript
  - Demonstrates basic state management and logging

## Getting Started

### Backend

1. Install dependencies:
   ```bash
   cd backend
   bun install
   ```
2. Run the server:
   ```bash
   bun run index.ts
   ```

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   bun install
   ```
2. Start the development server:
   ```bash
   bun dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Smart Contract (NEAR)

1. Install Node.js >= 16 and [NEAR CLI](https://github.com/near/near-cli#setup)
2. Build the contract:
   ```bash
   cd near-cross-chain-protocol
   npm run build
   ```

## Technologies Used

- **Backend:** Node.js, Express, Bun, TypeScript
- **Frontend:** Next.js, React, Tailwind CSS, TypeScript
- **Smart Contract:** NEAR, TypeScript

## Why This Project?

- **Interoperability:** Bridges the gap between blockchains, making DeFi more accessible.
- **User-Centric:** Focused on ease of use, security, and transparency.
- **Scalable & Modular:** Easily extendable to support more chains and features.

## Team & Contact

Built for ETHGlobal Hackathon 2025. For questions or demo requests, contact the team at [your-email@example.com].

---

*Thank you for reviewing our project!*
