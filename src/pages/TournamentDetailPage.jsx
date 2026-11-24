import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi.js';
import {
  ArrowLeft,
  Trophy,
  Gamepad2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore.js';
import { useTelegram } from '../store/useTelegram.js';
import { adminApi } from '../api/adminApi.js';

export const TournamentDetailPage = ({ onOpenDeposit }) => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateWalletBalance } = useAuthStore();
  const { haptic } = useTelegram();

  // Hook Telegram native back button to return to main tournaments page
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) {
      tg.BackButton.show();
      const onBack = () => navigate('/');
      tg.BackButton.onClick(onBack);
      return () => {
        tg.BackButton.offClick(onBack);
        tg.BackButton.hide();
      };
    }
  }, [navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentApi.getTournamentById(tournamentId),
    refetchInterval: 8000,
  });

  const joinMutation = useMutation({
    mutationFn: () => tournamentApi.joinTournament(tournamentId),
    onSuccess: (res) => {
      toast.success(res.message || 'Joined tournament!');
      haptic.success();
      if (res.walletBalance !== undefined) {
        updateWalletBalance(res.walletBalance);
      }
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to join');
      haptic.error();
      if (err.message?.toLowerCase().includes('balance')) {
        onOpenDeposit?.();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteTournament(tournamentId),
    onSuccess: (res) => {
      toast.success(res.message || 'Tournament deleted');
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      navigate('/');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete tournament'),
  });

  const handleDeleteTournament = () => {
    if (window.confirm('Delete this tournament? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const tournament = data?.tournament;
  const leaderboard = data?.leaderboard || [];

  if (isLoading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-6 w-20 bg-[#0E0E0E] rounded" />
        <div className="h-32 bg-[#0E0E0E] rounded-xl" />
        <div className="h-48 bg-[#0E0E0E] rounded-xl" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="py-16 text-center text-neutral-500 font-medium text-sm">
        Tournament not found
      </div>
    );
  }

  const isJoined = tournament.userParticipation?.isJoined;
  const turnsLeft = tournament.userParticipation?.turnsLeft ?? 0;
  const isEnded = tournament.hasEnded || tournament.status === 'DECLARED';
  const totalPrize = tournament.rewards?.reduce((a, b) => a + b, 0) || 0;

  const handleJoin = () => {
    haptic.selection();
    if (tournament.entryFee > (user?.walletBalance || 0)) {
      toast.error(
        `Need ₹${tournament.entryFee - (user?.walletBalance || 0)} more`
      );
      onOpenDeposit?.();
      return;
    }
    joinMutation.mutate();
  };

  return (
    <div className="space-y-3.5 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg bg-[#141414] border border-white/10 text-neutral-400 hover:text-white transition active:scale-95 flex-shrink-0"
            title="Back to tournaments"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-heading font-bold text-base text-white truncate">
            {tournament.title}
          </h2>
        </div>

        {user?.isAdmin && (
          <button
            onClick={handleDeleteTournament}
            disabled={deleteMutation.isPending}
            className="py-1 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-heading font-bold text-xs flex items-center gap-1 transition active:scale-95 disabled:opacity-50 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}
      </div>

      {/* Prize & Status Card */}
      <div className="rounded-xl p-4 theme-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-medium text-neutral-400 block">
              Prize Pool
            </span>
            <span className="font-heading text-2xl font-black text-sky-400">
              ₹{totalPrize}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-medium text-neutral-400 block">
              Entry Fee
            </span>
            <span className="font-heading text-base font-bold text-white">
              {tournament.entryFee === 0 ? 'FREE' : `₹${tournament.entryFee}`}
            </span>
          </div>
        </div>

        {/* Rewards per Rank */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/5">
          {tournament.rewards?.map((reward, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg text-center bg-[#141414] border border-white/5"
            >
              <div className="text-[10px] text-neutral-400 font-medium">
                Rank #{idx + 1}
              </div>
              <div className="font-heading font-bold text-sm text-white mt-0.5">
                ₹{reward}
              </div>
            </div>
          ))}
        </div>

        {/* Participation Stats */}
        {isJoined && (
          <div className="p-2.5 rounded-lg bg-[#141414] border border-white/5 flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-400">Best Score:</span>{' '}
              <span className="font-heading font-bold text-sky-400">
                {tournament.userParticipation.bestScore}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">Turns:</span>{' '}
              <span className="font-heading font-bold text-emerald-400">
                {turnsLeft} / {tournament.turnsPerUser}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {isJoined ? (
          turnsLeft > 0 && !isEnded ? (
            <button
              onClick={() => navigate(`/tournament/${tournament._id}/play`)}
              className="w-full py-2.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Gamepad2 className="w-4 h-4" /> Start Turn ({turnsLeft} Left)
            </button>
          ) : null
        ) : !isEnded && !tournament.isFull ? (
          <button
            onClick={handleJoin}
            disabled={joinMutation.isPending}
            className="w-full py-2.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5" />
            {joinMutation.isPending
              ? 'Joining...'
              : tournament.entryFee > 0
              ? `Join (₹${tournament.entryFee})`
              : 'Join Free'}
          </button>
        ) : null}
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-neutral-400">
            Leaderboard ({leaderboard.length}/{tournament.totalParticipantsAllowed})
          </h3>
        </div>

        {leaderboard.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-neutral-500">
            No entries yet
          </div>
        ) : (
          <div className="space-y-1.5">
            {leaderboard.map((player) => (
              <div
                key={player.userId || player.rank}
                className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                  player.isCurrentUser
                    ? 'bg-white/5 border-sky-400/40'
                    : 'bg-[#0E0E0E] border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded font-heading font-bold text-xs flex items-center justify-center ${
                      player.rank === 1
                        ? 'bg-amber-400 text-black'
                        : player.rank === 2
                        ? 'bg-neutral-300 text-black'
                        : player.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-[#181818] text-neutral-400'
                    }`}
                  >
                    {player.rank}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-medium text-white text-xs">
                      {player.name}
                    </span>
                    {player.isCurrentUser && (
                      <span className="text-[9px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/20 px-1 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 font-heading font-bold text-xs">
                  <span className="text-emerald-400 flex items-center gap-1">
                    💎 {player.bestDiamonds ?? 0}
                  </span>
                  <span className="text-neutral-500 font-normal text-[10px]">
                    ({player.bestScore} pts)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
