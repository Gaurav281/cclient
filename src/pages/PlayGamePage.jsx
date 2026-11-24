import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi.js';
import { gameApi } from '../api/gameApi.js';
import { CarGame } from '../components/game/CarGame.jsx';
import { toast } from 'sonner';
import { triggerFireAnimation } from '../utils/fireAnimation.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { Loader2 } from 'lucide-react';

export const PlayGamePage = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();

  // If tournamentId is provided, fetch tournament info
  const { data: tournamentData } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentApi.getTournamentById(tournamentId),
    enabled: Boolean(tournamentId),
  });

  const tournament = tournamentData?.tournament;
  const turnsLeft = tournament?.userParticipation?.turnsLeft ?? null;

  const handleScoreSubmit = async ({ tournamentId, score, diamondsCollected, distance }) => {
    try {
      const res = await gameApi.submitScore({
        tournamentId,
        score,
        diamondsCollected,
        distance,
      });

      // Fire animation celebration when tournament score is submitted!
      try {
        triggerFireAnimation();
      } catch (e) {}

      // Invalidate relevant queries
      if (tournamentId) {
        queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
        queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      }
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      refreshUser();

      return res;
    } catch (err) {
      toast.error(err.message || 'Failed to submit score');
      throw err;
    }
  };

  const handleExit = () => {
    if (tournamentId) {
      navigate(`/tournament/${tournamentId}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  if (tournamentId && !tournamentData) {
    return (
      <div className="w-full h-[100dvh] bg-black flex items-center justify-center">
        <div className="flex items-center gap-2 text-sky-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium text-sm text-neutral-300">Loading Tournament...</span>
        </div>
      </div>
    );
  }

  return (
    <CarGame
      tournament={tournament}
      turnsLeft={turnsLeft}
      onScoreSubmit={handleScoreSubmit}
      onExit={handleExit}
    />
  );
};
