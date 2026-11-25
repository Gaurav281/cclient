import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from '../api/walletApi.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { DepositModal } from '../components/wallet/DepositModal.jsx';
import { WithdrawModal } from '../components/wallet/WithdrawModal.jsx';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useTelegram } from '../store/useTelegram.js';

export const WalletPage = () => {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const { user, updateWalletBalance } = useAuthStore();
  const { haptic } = useTelegram();

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await walletApi.getWallet();
      if (res.balance !== undefined) {
        updateWalletBalance(res.balance);
      }
      return res;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes freshness: prevents redundant refetches on every page visit
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const currentBalance = data?.balance !== undefined ? data.balance : user?.walletBalance || 0;
  const transactions = data?.transactions || [];

  const handleManualRefresh = () => {
    haptic.selection();
    refetch();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 animate-pulse">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'REJECTED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-400">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3.5 pb-24 animate-fade-in">
      {/* Luxury Web3 Wallet Card (Inspired by card theme.jpg) */}
      <div className="rounded-3xl p-5 luxury-theme-card space-y-4">
        {/* Top Header Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-white/70">
              TOTAL VALUE
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            className={`p-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white transition active:scale-95 ${
              isRefetching ? 'animate-spin text-sky-400' : ''
            }`}
            title="Refresh balance"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Value */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight">
              ₹{currentBalance.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-white/60 tracking-wider">INR</span>
          </div>
          <p className="text-xs text-white/70 font-medium leading-relaxed">
            Available funds ready to join tournaments or withdraw
          </p>
        </div>
      </div>

      {/* Action Buttons Row (Convert / Withdraw in card theme.jpg) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setIsDepositOpen(true);
            haptic.light();
          }}
          className="py-3 px-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
        >
          <ArrowDownRight className="w-4 h-4 text-sky-400 stroke-[2.5]" />
          <span>Add Money</span>
        </button>

        <button
          onClick={() => {
            setIsWithdrawOpen(true);
            haptic.light();
          }}
          className="py-3 px-3 rounded-2xl blue-gradient-btn font-heading font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-black/40"
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          <span>Withdraw</span>
        </button>
      </div>

      {/* Transactions Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-neutral-400">
            Recent Transactions ({transactions.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-[#0E0E0E] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs font-medium text-neutral-500">
            No transactions
          </div>
        ) : (
          <div className="space-y-1.5">
            {transactions.map((txn) => {
              const isPositive = ['DEPOSIT', 'TOURNAMENT_WINNING', 'REFUND'].includes(txn.type);
              return (
                <div
                  key={txn._id}
                  className="p-2.5 rounded-lg bg-[#0E0E0E] border border-white/5 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center ${
                        txn.type === 'DEPOSIT'
                          ? 'bg-sky-400/10 text-sky-400'
                          : txn.type === 'WITHDRAWAL'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {txn.type === 'DEPOSIT' && <ArrowDownRight className="w-3.5 h-3.5" />}
                      {txn.type === 'WITHDRAWAL' && <ArrowUpRight className="w-3.5 h-3.5" />}
                      {txn.type === 'TOURNAMENT_WINNING' && <Trophy className="w-3.5 h-3.5" />}
                      {txn.type === 'TOURNAMENT_ENTRY' && <Wallet className="w-3.5 h-3.5" />}
                      {txn.type === 'REFUND' && <ArrowDownRight className="w-3.5 h-3.5" />}
                    </div>

                    <div>
                      <h4 className="font-heading font-medium text-white text-xs">
                        {txn.type === 'DEPOSIT' && 'Deposit'}
                        {txn.type === 'WITHDRAWAL' && 'Withdrawal'}
                        {txn.type === 'TOURNAMENT_ENTRY' && (txn.tournamentId?.title || 'Entry Fee')}
                        {txn.type === 'TOURNAMENT_WINNING' && (txn.tournamentId?.title ? `Prize: ${txn.tournamentId.title}` : 'Tournament Prize')}
                        {txn.type === 'REFUND' && 'Refund'}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-heading font-bold text-xs block ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isPositive ? '+' : '-'}₹{txn.amount}
                    </span>
                    <div className="mt-0.5">{getStatusBadge(txn.status)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        balance={currentBalance}
      />
    </div>
  );
};
