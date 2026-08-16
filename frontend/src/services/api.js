const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  // User APIs
  registerUser: async (walletAddress, userType) => {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress, userType }),
    });
    return response.json();
  },

  getUserProfile: async (walletAddress) => {
    const response = await fetch(`${API_URL}/users/${walletAddress}`);
    return response.json();
  },

  // Transaction APIs
  createTransaction: async (transactionData) => {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });
    return response.json();
  },

  getUserTransactions: async (walletAddress) => {
    const response = await fetch(`${API_URL}/transactions/user/${walletAddress}`);
    return response.json();
  },

  getAllTransactions: async () => {
    const response = await fetch(`${API_URL}/transactions`);
    return response.json();
  },

  // Update transaction status
  updateTransactionStatus: async (transactionHash, status) => {
    const response = await fetch(`${API_URL}/transactions/${transactionHash}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update transaction status: ${response.statusText}`);
    }
    return response.json();
  },
}; 