import { apiRequest } from './client.js';

export const adminApi = {
  getStats: async () => {
    return await apiRequest('/api/admin/stats');
  },

  createTournament: async (data) => {
    return await apiRequest('/api/admin/tournaments', {
      method: 'POST',
      body: data,
    });
  },

  deleteTournament: async (tournamentId) => {
    return await apiRequest(`/api/admin/tournaments/${tournamentId}`, {
      method: 'DELETE',
    });
  },

  declareResult: async (tournamentId) => {
    return await apiRequest(`/api/admin/tournaments/${tournamentId}/declare`, {
      method: 'POST',
    });
  },

  getTransactions: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return await apiRequest(`/api/admin/transactions${qs ? `?${qs}` : ''}`);
  },

  approveDeposit: async (transactionId, remarks) => {
    return await apiRequest(`/api/admin/transactions/deposit/${transactionId}/approve`, {
      method: 'POST',
      body: { remarks },
    });
  },

  rejectDeposit: async (transactionId, remarks) => {
    return await apiRequest(`/api/admin/transactions/deposit/${transactionId}/reject`, {
      method: 'POST',
      body: { remarks },
    });
  },

  approveWithdrawal: async (transactionId, remarks) => {
    return await apiRequest(`/api/admin/transactions/withdraw/${transactionId}/approve`, {
      method: 'POST',
      body: { remarks },
    });
  },

  rejectWithdrawal: async (transactionId, remarks) => {
    return await apiRequest(`/api/admin/transactions/withdraw/${transactionId}/reject`, {
      method: 'POST',
      body: { remarks },
    });
  },

  updateUpiConfig: async (upiId, upiName) => {
    return await apiRequest('/api/admin/config/upi', {
      method: 'POST',
      body: { upiId, upiName },
    });
  },

  broadcastMessage: async (message, buttonText) => {
    return await apiRequest('/api/admin/broadcast', {
      method: 'POST',
      body: { message, buttonText },
    });
  },
};
