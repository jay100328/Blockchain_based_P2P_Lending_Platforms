import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/P2PLending.json';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  const getContractAddress = async (provider) => {
    const network = await provider.getNetwork();
    const contractAddresses = {
      31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3", 
    };

    const address = contractAddresses[network.chainId.toString()] || process.env.REACT_APP_CONTRACT_ADDRESS;
    
    if (!address) {
      throw new Error(`No contract address found for network ${network.chainId}. Please update the contract addresses in Web3Context.js`);
    }

    console.log('Using contract address:', address, 'for network:', network.name);
    return address;
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      const contractAddress = await getContractAddress(provider);
      
      if (!contractAddress) {
        throw new Error('Contract address not found. Please check your network configuration.');
      }

      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      // Verify contract is properly initialized
      try {
        await contract.offerCount();
      } catch (error) {
        throw new Error('Failed to initialize contract. Please make sure you are connected to the correct network.');
      }

      // Set provider first to ensure it's available
      setProvider(provider);
      setAccount(address);
      setContract(contract);

      console.log('Wallet connected successfully:', {
        address,
        contractAddress,
        network: await provider.getNetwork()
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }
      setAccount(null);
      setContract(null);
      // Keeping provider state for future credit score implementation
    } catch (error) {
      setError(error.message || 'Failed to disconnect wallet');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        setAccount(null);
        setContract(null);
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload the page on chain change
      window.location.reload();
    };

    const initializeWallet = async () => {
      if (window.ethereum) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            console.log('Wallet already connected, initializing...');
            await connectWallet();
          }
        } catch (error) {
          console.error('Error initializing wallet:', error);
        }
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      initializeWallet();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const value = {
    account,
    contract,
    provider,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    clearError,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}; 