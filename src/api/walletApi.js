import { apiRequest } from './client.js';

export const walletApi = {
  getWallet: async () => {
    return await apiRequest('/api/wallet');
  },

  getUpiConfig: async () => {
    return await apiRequest('/api/wallet/upi-config');
  },

  submitDeposit: async ({ amount, transactionId }) => {
    return await apiRequest('/api/wallet/deposit', {
      method: 'POST',
      body: { amount, transactionId },
    });
  },

  submitWithdraw: async ({ amount, upiId }) => {
    return await apiRequest('/api/wallet/withdraw', {
      method: 'POST',
      body: { amount, upiId },
    });
  },
};
