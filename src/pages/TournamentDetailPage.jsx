import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi.js';
import {
  ArrowLeft,
  Trophy,
  Gamepad2,
  Trash2,
  Copy,
  Share2,
  Sparkles,
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
  const [inputReferralCode, setInputReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);

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
    initialData: () => {
      const cached = queryClient.getQueryData(['tournaments']);
      return cached?.tournaments?.find((t) => t._id === tournamentId);
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(['tournaments'])?.dataUpdatedAt,
    refetchInterval: 8000,
  });

  const joinMutation = useMutation({
    mutationFn: () => tournamentApi.joinTournament(tournamentId, inputReferralCode.trim()),
    onSuccess: (res) => {
      toast.success(res.message || 'Joined tournament!');
      haptic.success();
      setInputReferralCode('');
      setShowReferralInput(false);
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

  const handleCopyReferralCode = () => {
    const code = tournament?.userParticipation?.referralCode;
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success(`Referral code ${code} copied!`);
    haptic.success();
  };

  const handleShareOnTelegram = () => {
    const code = tournament?.userParticipation?.referralCode;
    if (!code) return;
    const shareText = `🏎️ Race with me in "${tournament.title}" on Firefly! Use my code [ ${code} ] when joining to get extra turns! 🏆\nPlay here: https://t.me/FireflyPlayBot/play`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent('https://t.me/FireflyPlayBot/play')}&text=${encodeURIComponent(shareText)}`;

    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
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

      {/* Prize & Status Card (Luxury Web3 Style) */}
      <div className="rounded-2xl p-4 luxury-theme-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-white/70 block">
              TOTAL PRIZE POOL
            </span>
            <span className="font-heading text-3xl font-black text-white">
              ₹{totalPrize}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-white/60 block">
              Entry Fee
            </span>
            <span className="font-heading text-base font-extrabold text-white px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 inline-block mt-0.5">
              {tournament.entryFee === 0 ? 'FREE' : `₹${tournament.entryFee}`}
            </span>
          </div>
        </div>

        {/* Rewards per Rank */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
          {tournament.rewards?.map((reward, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl text-center luxury-subcard"
            >
              <div className="text-[10px] text-white/60 font-heading font-bold uppercase tracking-wider">
                Rank #{idx + 1}
              </div>
              <div className="font-heading font-black text-sm text-white mt-0.5">
                ₹{reward}
              </div>
            </div>
          ))}
        </div>

        {/* Participation Stats */}
        {isJoined && (
          <div className="p-3 rounded-xl luxury-subcard flex items-center justify-between text-xs">
            <div>
              <span className="text-white/60 font-medium">Best Score:</span>{' '}
              <span className="font-heading font-black text-white">
                {tournament.userParticipation.bestScore}
              </span>
            </div>
            <div>
              <span className="text-white/60 font-medium">Turns:</span>{' '}
              <span className="font-heading font-black text-white">
                {turnsLeft}/{tournament.turnsPerUser}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {isJoined ? (
          turnsLeft > 0 && !isEnded ? (
            <button
              onClick={() => navigate(`/tournament/${tournament._id}/play`)}
              className="w-full py-2.5 rounded-xl blue-gradient-btn font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
            >
              <Gamepad2 className="w-4 h-4" /> Start Turn ({turnsLeft} Left)
            </button>
          ) : null
        ) : !isEnded && !tournament.isFull ? (
          <div className="space-y-2">
            {!showReferralInput ? (
              <button
                type="button"
                onClick={() => setShowReferralInput(true)}
                className="text-[11px] text-sky-400 hover:underline flex items-center justify-center gap-1 w-full"
              >
                <span>Have a friend&apos;s 6-digit referral code?</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-white/60 block">
                  Friend&apos;s 6-Digit Referral Code (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 582914"
                    value={inputReferralCode}
                    onChange={(e) => setInputReferralCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-white font-mono text-center text-sm font-bold tracking-widest focus:outline-none focus:border-amber-400"
                  />
                  {inputReferralCode && (
                    <button
                      type="button"
                      onClick={() => setInputReferralCode('')}
                      className="text-neutral-400 hover:text-white text-xs px-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              className="w-full py-2.5 rounded-xl blue-gradient-btn font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md disabled:opacity-50"
            >
              <Trophy className="w-3.5 h-3.5" />
              {joinMutation.isPending
                ? 'Joining...'
                : tournament.entryFee > 0
                ? `Join (₹${tournament.entryFee})`
                : 'Join Free'}
            </button>
          </div>
        ) : null}
      </div>

      {/* Tournament 6-Digit Referral Code Card (Earn Extra Turns) */}
      {isJoined && (
        <div
          className={`p-4 rounded-2xl luxury-subcard space-y-3 ${
            turnsLeft === 0
              ? 'border-amber-400/50 bg-amber-400/[0.06] shadow-lg shadow-amber-500/10'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-white/70">
              REFERRAL CODE (EARN +1 TURN)
            </span>
            {(tournament.userParticipation?.referralBonusTurnsEarned || 0) > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                +{tournament.userParticipation.referralBonusTurnsEarned} turns earned!
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/50 border border-white/10">
            <span className="font-mono font-black text-2xl tracking-[0.25em] text-amber-400 pl-1">
              {tournament.userParticipation?.referralCode || '------'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyReferralCode}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={handleShareOnTelegram}
                className="px-3 py-1.5 rounded-lg blue-gradient-btn font-heading font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-white/70 leading-relaxed">
            {turnsLeft === 0 ? (
              <span className="text-amber-300 font-medium">
                ⚠️ Out of turns? Share your 6-digit code! Every time someone joins using your code, you get{' '}
                <strong className="text-white font-bold">+1 EXTRA TURN</strong> immediately! 🏎️💨
              </span>
            ) : (
              <span>
                Share your code with other racers. Whenever someone joins using your code, you get{' '}
                <strong className="text-amber-400 font-bold">+1 EXTRA TURN</strong> automatically!
              </span>
            )}
          </p>
        </div>
      )}

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
