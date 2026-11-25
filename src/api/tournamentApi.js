import { apiRequest } from './client.js';

export const tournamentApi = {
  getTournaments: async () => {
    return await apiRequest('/api/tournaments');
  },

  getTournamentById: async (tournamentId) => {
    return await apiRequest(`/api/tournaments/${tournamentId}`);
  },

  joinTournament: async (tournamentId, referralCode) => {
    const id = typeof tournamentId === 'object' ? tournamentId.tournamentId : tournamentId;
    const code = typeof tournamentId === 'object' ? tournamentId.referralCode : referralCode;
    return await apiRequest(`/api/tournaments/${id}/join`, {
      method: 'POST',
      body: code ? { referralCode: code } : {},
    });
  },

  joinTournamentByCode: async (referralCode) => {
    return await apiRequest('/api/tournaments/join-by-code', {
      method: 'POST',
      body: { referralCode },
    });
  },
};
