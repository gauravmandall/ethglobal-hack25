import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import "./App.css"
import WalletConnector from './components/WalletConnector';

// TypeScript types
interface Token {
  symbol: string;
  name: string;
  icon?: string;
}

interface SwapState {
  fromToken: string;
  toToken: string;
  amount: string;
}

// Token options
const TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'DAI', name: 'Dai Stablecoin' },
  { symbol: 'USDT', name: 'Tether USD' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
  { symbol: 'UNI', name: 'Uniswap' },
];

// Header Component
const Header: React.FC = () => (
  <header className="text-center mb-8">
    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
      Set smart limit on any token powered by{' '}
      <span className="text-blue-600">Pyth Pricefeeds</span> and{' '}
      <span className="text-orange-500">1inch Swap</span>
    </h1>
  </header>
);

// Wallet Connect Button Component
interface WalletButtonProps {
  isConnected: boolean;
  onClick: () => void;
}

const WalletButton: React.FC<WalletButtonProps> = ({ isConnected, onClick }) => (
  <div className="flex justify-center mb-8">
    <button
      onClick={onClick}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
    >
      {isConnected ? 'Wallet Connected ✓' : 'Connect Wallet'}
    </button>
  </div>
);

// Token Dropdown Component (unchanged)
interface TokenDropdownProps {
  label: string;
  selectedToken: string;
  onTokenSelect: (token: string) => void;
  disabled?: boolean;
}

const TokenDropdown: React.FC<TokenDropdownProps> = ({ 
  label, 
  selectedToken, 
  onTokenSelect, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTokenData = TOKENS.find(t => t.symbol === selectedToken);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            {selectedTokenData ? (
              <div>
                <span className="font-semibold text-gray-900">{selectedTokenData.symbol}</span>
                <span className="text-sm text-gray-500 ml-2">{selectedTokenData.name}</span>
              </div>
            ) : (
              <span className="text-gray-500">Select token</span>
            )}
          </div>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg border border-gray-200 overflow-auto">
          {TOKENS.map((token) => (
            <button
              key={token.symbol}
              type="button"
              onClick={() => {
                onTokenSelect(token.symbol);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
            >
              <div>
                <div className="font-semibold text-gray-900">{token.symbol}</div>
                <div className="text-sm text-gray-500">{token.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Swap Card Component (unchanged)
interface SwapCardProps {
  swapState: SwapState;
  onSwapStateChange: (newState: SwapState) => void;
  onPlaceOrder: () => void;
  isWalletConnected: boolean;
}

const SwapCard: React.FC<SwapCardProps> = ({ 
  swapState, 
  onSwapStateChange, 
  onPlaceOrder,
  isWalletConnected 
}) => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onSwapStateChange({ ...swapState, amount: value });
    }
  };

  const isFormValid = swapState.fromToken && swapState.toToken && swapState.amount && isWalletConnected;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
        Smart Limit Swap
      </h2>
      
      <div className="space-y-6">
        <TokenDropdown
          label="From"
          selectedToken={swapState.fromToken}
          onTokenSelect={(token) => onSwapStateChange({ ...swapState, fromToken: token })}
          disabled={!isWalletConnected}
        />
        
        <TokenDropdown
          label="To"
          selectedToken={swapState.toToken}
          onTokenSelect={(token) => onSwapStateChange({ ...swapState, toToken: token })}
          disabled={!isWalletConnected}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Value
          </label>
          <input
            type="text"
            value={swapState.amount}
            onChange={handleAmountChange}
            placeholder="Enter expected value to swap"
            disabled={!isWalletConnected}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
              !isWalletConnected ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
          />
        </div>
        
        <button
          onClick={onPlaceOrder}
          disabled={!isFormValid}
          className={`w-full font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-200 ${
            isFormValid
              ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white hover:shadow-xl transform hover:scale-105 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {!isWalletConnected ? 'Connect Wallet to Continue' : 'Place Swap Order'}
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [swapState, setSwapState] = useState<SwapState>({
    fromToken: '',
    toToken: '',
    amount: ''
  });

  // Connect to MetaMask using WalletConnector
  const handleWalletConnect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setIsWalletConnected(true);
        }
      } catch (err) {
        console.error('MetaMask connection error:', err);
      }
    } else {
      alert('MetaMask is not installed');
    }
  };

  const handlePlaceOrder = () => {
    if (swapState.fromToken && swapState.toToken && swapState.amount) {
      alert(`Placing swap order:\n${swapState.amount} ${swapState.fromToken} → ${swapState.toToken}`);
      setSwapState({ fromToken: '', toToken: '', amount: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Header />
          <WalletButton 
            isConnected={isWalletConnected}
            onClick={handleWalletConnect}
          />
          <SwapCard
            swapState={swapState}
            onSwapStateChange={setSwapState}
            onPlaceOrder={handlePlaceOrder}
            isWalletConnected={isWalletConnected}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
