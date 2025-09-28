# Wallet Connection Setup

This application supports connecting to multiple wallets including MetaMask, WalletConnect, Coinbase Wallet, and other injected wallets.

## Setup Instructions

### 1. WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project or use an existing one
3. Copy your Project ID
4. Create a `.env.local` file in the frontend directory with:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

### 2. Supported Wallets

The application supports the following wallet types:

- **MetaMask**: Browser extension wallet
- **WalletConnect**: Mobile wallet connections via QR code
- **Coinbase Wallet**: Coinbase's browser extension and mobile wallet
- **Injected Wallets**: Any wallet that injects into the browser (Brave, Trust Wallet, etc.)

### 3. Supported Networks

The application is configured to work with:

- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- Sepolia (testnet)

### 4. Features

- **Multi-wallet support**: Users can connect with their preferred wallet
- **Real-time balance**: Shows actual wallet balance
- **Network switching**: Supports multiple EVM-compatible networks
- **Address formatting**: Displays wallet addresses in a user-friendly format
- **Explorer integration**: Direct links to blockchain explorers

### 5. Usage

1. Click "Connect Wallet" button
2. Select your preferred wallet from the list
3. Follow the wallet's connection prompts
4. Once connected, you can see your balance and start trading

### 6. Development

The wallet connection is implemented using:

- **wagmi**: React hooks for Ethereum
- **viem**: TypeScript interface for Ethereum
- **@tanstack/react-query**: Data fetching and caching
- **@walletconnect/web3-provider**: WalletConnect integration

### 7. Troubleshooting

- Make sure you have a WalletConnect Project ID set in your environment variables
- Ensure your wallet extension is installed and unlocked
- Check that you're on a supported network
- For WalletConnect, make sure your mobile wallet supports WalletConnect v2

### 8. Security Notes

- Never commit your WalletConnect Project ID to version control
- Always use HTTPS in production
- Validate all wallet interactions on the backend
- Implement proper error handling for failed connections
