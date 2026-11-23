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
  Trophy,
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
    refetchInterval: 10000,
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
      {/* Balance Card */}
      <div className="rounded-xl p-4 bg-[#0E0E0E] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-[#181818] text-neutral-300">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              Total Balance
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            className={`p-1 rounded text-neutral-400 hover:text-white transition ${
              isRefetching ? 'animate-spin text-sky-400' : ''
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div>
          <span className="font-heading text-3xl font-black text-white">
            ₹{currentBalance.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              setIsDepositOpen(true);
              haptic.light();
            }}
            className="py-2.5 px-3 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
            Add Money
          </button>

          <button
            onClick={() => {
              setIsWithdrawOpen(true);
              haptic.light();
            }}
            className="py-2.5 px-3 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-red-500/25 font-heading font-bold text-red-400 text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            Withdraw
          </button>
        </div>
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
