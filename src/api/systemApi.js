import { apiRequest } from './client.js';

export const systemApi = {
  getRequiredChats: async () => {
    return await apiRequest('/api/system/required-chats');
  },

  verifyJoins: async (clientConfirmedIds = []) => {
    return await apiRequest('/api/system/verify-joins', {
      method: 'POST',
      body: { clientConfirmedIds },
    });
  },
};
