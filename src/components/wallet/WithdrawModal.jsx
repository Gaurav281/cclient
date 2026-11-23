import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { walletApi } from '../../api/walletApi.js';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useTelegram } from '../../store/useTelegram.js';

export const WithdrawModal = ({ isOpen, onClose, balance = 0 }) => {
  const { user, updateWalletBalance } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();
  const { haptic } = useTelegram();

  useEffect(() => {
    if (user?.savedUpiId) {
      setUpiId(user.savedUpiId);
    }
  }, [user?.savedUpiId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    const cleanUpi = upiId.trim();

    if (!numAmount || numAmount < 10) {
      toast.error('Minimum withdrawal is ₹10');
      haptic.error();
      return;
    }

    if (numAmount > balance) {
      toast.error(`Insufficient balance (₹${balance})`);
      haptic.error();
      return;
    }

    if (!cleanUpi || !cleanUpi.includes('@')) {
      toast.error('Enter valid UPI ID (e.g. name@bank)');
      haptic.error();
      return;
    }

    setLoading(true);
    try {
      const res = await walletApi.submitWithdraw({
        amount: numAmount,
        upiId: cleanUpi,
      });

      toast.success(res.message || 'Withdrawal submitted!');
      haptic.success();

      if (res.newBalance !== undefined) {
        updateWalletBalance(res.newBalance);
      }

      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });

      setAmount('');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Withdrawal failed');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-md bg-[#0E0E0E] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-sm text-white">Withdraw</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance */}
        <div className="my-3 p-2.5 rounded-lg bg-[#141414] border border-white/5 flex items-center justify-between">
          <span className="text-xs text-neutral-400">Available</span>
          <span className="font-heading font-bold text-emerald-400 text-sm">
            ₹{balance.toLocaleString('en-IN')}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              min="10"
              max={balance}
              required
              placeholder="Min ₹10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400 font-heading text-sm"
            />
            {balance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(balance))}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium mt-1 inline-block"
              >
                Max: ₹{balance}
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                UPI ID
              </label>
              {user?.savedUpiId && upiId === user.savedUpiId && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. name@okaxis"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400 font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading || balance < 10}
            className="w-full py-2.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide disabled:opacity-50 transition active:scale-95"
          >
            {loading ? 'Submitting...' : 'Confirm Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
};
