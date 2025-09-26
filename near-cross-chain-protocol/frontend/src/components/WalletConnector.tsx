import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletConnector: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);

  // Function to connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed!');
        return;
      }

      // Request accounts
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  // Detect account/network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setAccount(accounts[0] || null);
    };

    const handleChainChanged = () => {
      window.location.reload(); // reload on network change
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return (
    <div className="flex flex-col items-center mt-10 space-y-4">
      <button
        onClick={connectWallet}
        className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
      >
        {account ? `Connected: ${account.slice(0,6)}...${account.slice(-4)}` : 'Connect Wallet'}
      </button>

      {account && (
        <div className="p-4 bg-white rounded-lg shadow-md">
          <p className="text-gray-700">Wallet Address:</p>
          <p className="font-mono text-sm">{account}</p>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;

