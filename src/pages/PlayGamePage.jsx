import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi.js';
import { gameApi } from '../api/gameApi.js';
import { CarGame } from '../components/game/CarGame.jsx';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useAuthStore } from '../store/useAuthStore.js';

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

      // Confetti celebration if high score
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
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
      navigate(`/tournament/${tournamentId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <CarGame
      tournament={tournament}
      turnsLeft={turnsLeft}
      onScoreSubmit={handleScoreSubmit}
      onExit={handleExit}
    />
  );
};
