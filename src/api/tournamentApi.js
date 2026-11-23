import { apiRequest } from './client.js';

export const tournamentApi = {
  getTournaments: async () => {
    return await apiRequest('/api/tournaments');
  },

  getTournamentById: async (tournamentId) => {
    return await apiRequest(`/api/tournaments/${tournamentId}`);
  },

  joinTournament: async (tournamentId) => {
    return await apiRequest(`/api/tournaments/${tournamentId}/join`, {
      method: 'POST',
    });
  },
};
