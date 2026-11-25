import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi.js';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Gamepad2,
  ChevronRight,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore.js';
import { useTelegram } from '../store/useTelegram.js';

export const TournamentsPage = ({ onOpenDeposit }) => {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'my' | 'completed'
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateWalletBalance } = useAuthStore();
  const { haptic } = useTelegram();

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentApi.getTournaments,
    refetchInterval: () => (document.visibilityState === 'visible' ? 15000 : false),
    refetchIntervalInBackground: false,
  });

  const joinMutation = useMutation({
    mutationFn: tournamentApi.joinTournament,
    onSuccess: (res) => {
      toast.success(res.message || 'Joined tournament!');
      haptic.success();
      if (res.walletBalance !== undefined) {
        updateWalletBalance(res.walletBalance);
      }
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to join tournament');
      haptic.error();
      if (err.message?.toLowerCase().includes('balance')) {
        onOpenDeposit?.();
      }
    },
  });

  const tournaments = data?.tournaments || [];

  const filteredTournaments = tournaments.filter((t) => {
    if (activeTab === 'active') {
      return t.status === 'ACTIVE' && !t.hasEnded;
    }
    if (activeTab === 'completed') {
      // Only show finished tournaments that this user participated in
      return (t.status === 'DECLARED' || t.hasEnded) && Boolean(t.userParticipation?.isJoined);
    }
    if (activeTab === 'my') {
      return t.userParticipation?.isJoined;
    }
    return true;
  });

  const getTimeRemaining = (endTimeStr) => {
    const diff = new Date(endTimeStr) - new Date();
    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const handleJoin = (e, tournament) => {
    e.stopPropagation();
    haptic.selection();

    if (tournament.entryFee > (user?.walletBalance || 0)) {
      toast.error(
        `Need ₹${tournament.entryFee - (user?.walletBalance || 0)} more`
      );
      onOpenDeposit?.();
      return;
    }

    joinMutation.mutate(tournament._id);
  };

  const handlePlayTurn = (e, tournament) => {
    e.stopPropagation();
    haptic.light();
    navigate(`/tournament/${tournament._id}/play`);
  };

  const prefetchTournament = (tournamentId) => {
    queryClient.prefetchQuery({
      queryKey: ['tournament', tournamentId],
      queryFn: () => tournamentApi.getTournamentById(tournamentId),
      staleTime: 1000 * 30,
    });
  };

  return (
    <div className="space-y-3.5 pb-24 animate-fade-in">
      {/* Practice Car Game Banner */}
      <div
        onClick={() => {
          haptic.light();
          navigate('/play');
        }}
        className="relative w-full aspect-[1200/670] rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all group theme-card shadow-xl"
      >
        {/* Full Cover Car Game Image (100% visible top & bottom) */}
        <img
          src="/car-game.jpeg"
          alt="Practice Car Game"
          className="w-full h-full object-contain sm:object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
        />

        {/* Subtle Right-side Gradient Shade for Button Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/75 pointer-events-none" />

        {/* Practice Now Button in the Middle of Right Side */}
        <div className="absolute right-3.5 sm:right-5 top-1/2 -translate-y-1/2 z-10">
          <button
            type="button"
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl blue-gradient-btn font-heading font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-black/80 group-hover:scale-105 transition-all active:scale-95 border border-white/20"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Practice Now</span>
          </button>
        </div>
      </div>

      {/* Premium Neutral Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0E0E0E] border border-white/10">
        {[
          { id: 'active', label: 'Live' },
          { id: 'my', label: 'Joined' },
          { id: 'completed', label: 'Finished' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              haptic.selection();
            }}
            className={`flex-1 py-1.5 rounded-lg font-heading font-medium text-xs transition-colors ${
              activeTab === tab.id
                ? 'bg-sky-400 text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tournament Cards List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-[#0E0E0E] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-heading font-medium text-neutral-500 text-sm">
            No tournament
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTournaments.map((t) => {
            const isJoined = t.userParticipation?.isJoined;
            const turnsLeft = t.userParticipation?.turnsLeft ?? 0;
            const isFull = t.currentParticipantsCount >= t.totalParticipantsAllowed;
            const isEnded = t.hasEnded || t.status === 'DECLARED';
            const totalPrize = t.rewards?.reduce((a, b) => a + b, 0) || 0;

            return (
              <div
                key={t._id}
                onPointerEnter={() => prefetchTournament(t._id)}
                onTouchStart={() => prefetchTournament(t._id)}
                onClick={() => {
                  haptic.light();
                  navigate(`/tournament/${t._id}`);
                }}
                className="rounded-xl p-3.5 theme-card cursor-pointer active:scale-[0.99] space-y-3"
              >
                {/* Header Row: Title + Entry Fee Tag + Time/Status */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading font-bold text-sm text-white truncate">
                    {t.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-heading font-bold text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-sky-400">
                      {t.entryFee === 0 ? 'FREE' : `₹${t.entryFee}`}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {isEnded ? (
                        <span className="text-red-400 font-semibold">Ended</span>
                      ) : (
                        getTimeRemaining(t.endTime)
                      )}
                    </span>
                  </div>
                </div>

                {/* Structured Key Details Grid */}
                <div className="grid grid-cols-3 gap-2 py-1 border-y border-white/5 text-center">
                  <div className="p-1.5 rounded bg-[#141414]">
                    <span className="text-[9px] text-neutral-400 font-medium uppercase block">
                      Prize Pool
                    </span>
                    <span className="font-heading font-bold text-sm text-sky-400">
                      ₹{totalPrize}
                    </span>
                  </div>

                  <div className="p-1.5 rounded bg-[#141414]">
                    <span className="text-[9px] text-neutral-400 font-medium uppercase block">
                      Racers
                    </span>
                    <span className="font-heading font-bold text-sm text-white">
                      {t.currentParticipantsCount}/{t.totalParticipantsAllowed}
                    </span>
                  </div>

                  <div className="p-1.5 rounded bg-[#141414]">
                    <span className="text-[9px] text-neutral-400 font-medium uppercase block">
                      Turns
                    </span>
                    <span className="font-heading font-bold text-sm text-white">
                      {isJoined ? `${turnsLeft}/${t.turnsPerUser}` : t.turnsPerUser}
                    </span>
                  </div>
                </div>

                {/* Rewards Breakdown (Rank 1, 2, 3) */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {t.rewards?.map((reward, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 bg-[#141414] border border-white/5 text-neutral-300 shrink-0"
                    >
                      <span className="text-neutral-400">#{idx + 1}</span>
                      <span className="font-semibold text-white">₹{reward}</span>
                    </div>
                  ))}
                  {t.status === 'DECLARED' && (
                    <span className="text-[10px] font-bold text-emerald-400 ml-auto shrink-0">
                      Declared
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#181818] h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (t.currentParticipantsCount / t.totalParticipantsAllowed) * 100
                      )}%`,
                    }}
                  />
                </div>

                {/* Action Button */}
                <div>
                  {isJoined ? (
                    turnsLeft > 0 && !isEnded ? (
                      <button
                        onClick={(e) => handlePlayTurn(e, t)}
                        className="w-full py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" /> Play Turn ({turnsLeft} Left)
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tournament/${t._id}`);
                        }}
                        className="w-full py-2 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-white/10 text-neutral-300 font-heading font-medium text-xs tracking-wide flex items-center justify-center gap-1.5"
                      >
                        <Trophy className="w-3.5 h-3.5 text-neutral-400" /> Leaderboard
                      </button>
                    )
                  ) : !isEnded && !isFull ? (
                    <button
                      onClick={(e) => handleJoin(e, t)}
                      disabled={joinMutation.isPending}
                      className="w-full py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      {joinMutation.isPending
                        ? 'Joining...'
                        : t.entryFee > 0
                        ? `Join (₹${t.entryFee})`
                        : 'Join Free'}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tournament/${t._id}`);
                      }}
                      className="w-full py-2 rounded-lg bg-[#141414] border border-white/10 text-neutral-400 font-heading font-medium text-xs flex items-center justify-center gap-1"
                    >
                      {isFull ? 'Full' : 'View Details'} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
