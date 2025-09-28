
---

# OneInchSwap 

A DeFi protocol enabling **cross-chain token swaps** and **automated stop-loss orders**.
Built for **ETHGlobal Hackathon 2025**, it combines **interoperability** with **risk management**, offering traders a seamless and secure DeFi experience.

---

## Features

* **Automated Stop-Loss Orders** – Protect your portfolio with automated sell triggers using the 1inch Limit Order Protocol.
* **Secure Order Management** – Create, submit, and cancel swap/stop-loss orders with validation and rate limiting.
* **Real-Time Portfolio View** – Fetch live token balances via the 1inch API.
* **Wallet Integration** – Connect MetaMask or WalletConnect for direct interaction.
* **Modern UI** – Fast, responsive interface built with Next.js and Tailwind CSS.
* **Smart Contract Layer** – NEAR contract template for cross-chain state management and extensibility.

---

## Architecture

* **Frontend (`frontend/`)**

  * Next.js + React + Tailwind CSS
  * Wallet connection, swap interface, stop-loss dashboard, order book, and charts

* **Backend (`backend/`)**

  * Node.js + Express on Bun runtime
  * Order lifecycle management, cross-chain logic, stop-loss execution
  * Integrates with 1inch Balances API + Limit Order Protocol

* **Smart Contracts (`near-cross-chain-protocol/`)**

  * NEAR contract in TypeScript
  * Handles on-chain state and logging

---

## Getting Started

### Backend

```bash
cd backend
bun install
bun run index.ts
```

### Frontend

```bash
cd frontend
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Smart Contract (NEAR)

```bash
cd near-cross-chain-protocol
npm run build
```

(Requires Node.js ≥16 and [NEAR CLI](https://github.com/near/near-cli#setup))

---

## Tech Stack

* **Frontend:** Next.js, React, Tailwind CSS, TypeScript
* **Backend:** Node.js, Express, Bun, TypeScript
* **APIs:** 1inch Balances API, 1inch Limit Order Protocol
* **Smart Contracts:** NEAR, TypeScript

---

## Roadmap

* Multi-chain stop-loss support
* Take-profit and trailing-stop orders
* Cross-chain liquidity aggregation
* Advanced portfolio dashboard and notifications

---

## Team & Contact

Built for **ETHGlobal Hackathon 2025**.
For questions or demo requests, contact: **[[uudaipuria@gmail.com]]**

 **Built with love by OneInchSwap devolopers**

---