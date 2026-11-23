import { apiRequest } from './client.js';

export const gameApi = {
  submitScore: async ({ tournamentId, score, diamondsCollected, distance }) => {
    return await apiRequest('/api/game/submit-score', {
      method: 'POST',
      body: { tournamentId, score, diamondsCollected, distance },
    });
  },
};
