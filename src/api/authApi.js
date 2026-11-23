import { apiRequest, setAuthToken } from './client.js';

export const authApi = {
  loginWithTelegram: async (initData, user = null) => {
    const res = await apiRequest('/api/auth/telegram', {
      method: 'POST',
      body: { initData, user },
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  devLogin: async (data = {}) => {
    const res = await apiRequest('/api/auth/dev-login', {
      method: 'POST',
      body: data,
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  getMe: async () => {
    return await apiRequest('/api/auth/me');
  },

  updateSavedUpi: async (upiId) => {
    return await apiRequest('/api/auth/upi', {
      method: 'PUT',
      body: { upiId },
    });
  },
};
