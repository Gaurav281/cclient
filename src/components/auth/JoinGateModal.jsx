import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '../../api/systemApi.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useTelegram } from '../../store/useTelegram.js';
import { Megaphone, MessageSquare, Bot, RefreshCw, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { FireLogo } from '../common/FireLogo.jsx';

export const JoinGateModal = () => {
  const { user } = useAuthStore();
  const { haptic } = useTelegram();
  const queryClient = useQueryClient();

  const [clickedChatIds, setClickedChatIds] = useState(new Set());

  // Fetch required chats with responsive cache
  const { data, isLoading } = useQuery({
    queryKey: ['requiredChats'],
    queryFn: systemApi.getRequiredChats,
    staleTime: 1000 * 30, // 30 seconds
  });

  const requiredChats = data?.requiredChats || [];
  const hasCompleted = data?.hasCompletedRequiredChats === true;
  const serverJoinedIds = new Set((data?.joinedChats || []).map(String));

  const totalRequired = requiredChats.length;
  // Combine server joined and local verified clicks
  const joinedCount = requiredChats.filter(
    (c) => serverJoinedIds.has(String(c._id)) || clickedChatIds.has(String(c._id))
  ).length;

  const verifyMutation = useMutation({
    mutationFn: () => systemApi.verifyJoins(Array.from(clickedChatIds)),
    onSuccess: (res) => {
      if (res.allJoined) {
        toast.success(res.message || 'All channels verified! Welcome to Firefly!');
        haptic.success();
        // Immediately sync auth store
        if (user) {
          useAuthStore.setState({
            user: {
              ...user,
              hasCompletedRequiredChats: true,
              joinedChats: res.joinedChats || [],
            },
          });
        }
        queryClient.invalidateQueries({ queryKey: ['requiredChats'] });
        queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      } else {
        toast.error(res.message || 'You have not joined all required chats yet!');
        haptic.error();
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Verification failed: please join the channels first!');
      haptic.error();
    },
  });

  // If loading, or no required chats exist, or user is strictly verified by server, do not show modal
  if (isLoading || !data || totalRequired === 0 || hasCompleted) {
    return null;
  }

  const handleOpenLink = (chat) => {
    haptic.selection();
    setClickedChatIds((prev) => new Set(prev).add(String(chat._id)));

    // Open link via Telegram WebApp if available, else window.open
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink && chat.link.includes('t.me')) {
      tg.openTelegramLink(chat.link);
    } else if (tg?.openLink) {
      tg.openLink(chat.link);
    } else {
      window.open(chat.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVerify = () => {
    haptic.medium();
    verifyMutation.mutate();
  };

  const getChatIcon = (type) => {
    switch (type) {
      case 'group':
        return <MessageSquare className="w-5 h-5 text-white" />;
      case 'bot':
        return <Bot className="w-5 h-5 text-white" />;
      case 'channel':
      default:
        return <Megaphone className="w-5 h-5 text-white" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'group':
        return '👥 Group';
      case 'bot':
        return '🤖 Bot';
      case 'channel':
      default:
        return '📢 Channel';
    }
  };

  const progressPercent = totalRequired > 0 ? (joinedCount / totalRequired) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F4F6] text-[#111111] flex flex-col justify-between p-6 overflow-y-auto animate-fade-in font-sans">
      <div className="w-full max-w-sm mx-auto space-y-6 pt-4">
        {/* Top Logo Badge */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center p-3 border border-neutral-200">
            <FireLogo className="w-12 h-12" outerColor="#000000" innerColor="#555555" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center space-y-2">
          <h1 className="font-heading font-extrabold text-2xl text-black tracking-tight">
            One step to play
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm font-medium leading-relaxed px-2">
            Join these chats for codes, drops and news, then tap &ldquo;I&apos;ve joined&rdquo;.
          </p>
        </div>

        {/* Progress Counter & Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-end text-xs font-semibold text-neutral-500">
            <span>{joinedCount}/{totalRequired} joined</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>

        {/* Required Chats List */}
        <div className="space-y-3 pt-1">
          {requiredChats.map((chat) => {
            const isJoined = serverJoinedIds.has(String(chat._id));
            const isClicked = clickedChatIds.has(String(chat._id));

            return (
              <div
                key={chat._id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 flex items-center justify-between gap-3 transition"
              >
                {/* Left Icon + Text */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 shadow-sm">
                    {getChatIcon(chat.type)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-sm text-black truncate leading-tight">
                      {chat.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5 font-medium flex items-center gap-1">
                      {getTypeLabel(chat.type)}
                    </p>
                  </div>
                </div>

                {/* Right Action Button */}
                <div>
                  {isJoined ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 font-heading font-bold text-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Joined</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenLink(chat)}
                      className={`px-4 py-2 rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm ${
                        isClicked
                          ? 'bg-neutral-800 text-white'
                          : 'bg-black text-white hover:bg-neutral-900'
                      }`}
                    >
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action: "I've joined" + Disclaimer */}
      <div className="w-full max-w-sm mx-auto pt-6 pb-2 space-y-2.5">
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
          className="w-full py-4 rounded-2xl bg-black text-white font-heading font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/15 hover:bg-neutral-900 active:scale-98 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 stroke-[2.5] ${verifyMutation.isPending ? 'animate-spin' : ''}`} />
          <span>{verifyMutation.isPending ? 'Verifying...' : "I've joined"}</span>
        </button>

        <p className="text-[11px] text-neutral-400 text-center font-medium leading-tight">
          We check it with Telegram. It can take a few seconds after you join.
        </p>
      </div>
    </div>
  );
};
