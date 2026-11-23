import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { walletApi } from '../../api/walletApi.js';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTelegram } from '../../store/useTelegram.js';

export const DepositModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [upiConfig, setUpiConfig] = useState({
    upiId: 'fireflypay@upi',
    upiName: 'Firefly Car Tournament',
  });

  const queryClient = useQueryClient();
  const { haptic } = useTelegram();

  useEffect(() => {
    if (isOpen) {
      walletApi
        .getUpiConfig()
        .then((res) => {
          if (res.upiId) setUpiConfig({ upiId: res.upiId, upiName: res.upiName });
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickAmounts = [10, 20, 50, 100];
  const finalAmount = customAmount ? Number(customAmount) : amount;

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiConfig.upiId)}&pn=${encodeURIComponent(
    upiConfig.upiName
  )}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent('CarTournamentDeposit')}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiConfig.upiId);
    setCopied(true);
    haptic.selection();
    toast.success('UPI ID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!finalAmount || finalAmount < 10) {
        toast.error('Minimum amount ₹10');
        haptic.error();
        return;
      }
      setStep(2);
      haptic.light();
    } else if (step === 2) {
      setStep(3);
      haptic.light();
    }
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    const cleanTxnId = transactionId.trim();

    if (!cleanTxnId || cleanTxnId.length < 6) {
      toast.error('Enter valid 12-digit UTR');
      haptic.error();
      return;
    }

    setLoading(true);
    try {
      const res = await walletApi.submitDeposit({
        amount: finalAmount,
        transactionId: cleanTxnId,
      });

      toast.success(res.message || 'Deposit submitted');
      haptic.success();

      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });

      setStep(1);
      setTransactionId('');
      setCustomAmount('');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Deposit submission failed');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-md bg-[#0E0E0E] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#181818] border border-white/10 flex items-center justify-center text-sky-400 font-bold text-xs">
              {step}/3
            </div>
            <h3 className="font-heading font-bold text-sm text-white">
              {step === 1 && 'Select Amount'}
              {step === 2 && 'Scan & Pay'}
              {step === 3 && 'Enter Transaction ID'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#181818] h-1 rounded-full my-3 overflow-hidden">
          <div
            className="bg-sky-400 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* STEP 1: SELECT AMOUNT */}
        {step === 1 && (
          <div className="space-y-3.5 py-1">
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amt) => {
                const isSelected = !customAmount && amount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setAmount(amt);
                      setCustomAmount('');
                      haptic.selection();
                    }}
                    className={`py-2.5 rounded-lg font-heading font-bold text-sm transition-colors ${
                      isSelected
                        ? 'bg-sky-400 text-black'
                        : 'bg-[#141414] text-neutral-300 hover:bg-[#1A1A1A] border border-white/10'
                    }`}
                  >
                    ₹{amt}
                  </button>
                );
              })}
            </div>

            <div>
              <input
                type="number"
                min="10"
                placeholder="Custom Amount (Min ₹10)"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  if (e.target.value) setAmount(Number(e.target.value));
                }}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400 font-heading text-sm"
              />
            </div>

            <button
              onClick={handleNextStep}
              className="w-full py-2.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              Continue with ₹{finalAmount} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: SCAN QR & PAY */}
        {step === 2 && (
          <div className="space-y-3 py-1 text-center">
            <div className="inline-block p-2.5 rounded-xl bg-white border border-white/20">
              <QRCodeSVG
                value={upiUri}
                size={150}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="font-heading text-xl font-bold text-white">
              ₹{finalAmount}
            </div>

            {/* UPI ID copy */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#141414] border border-white/10 text-left">
              <span className="font-mono text-xs text-neutral-300 truncate max-w-[240px]">
                {upiConfig.upiId}
              </span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-1 rounded bg-[#1F1F1F] text-sky-400 hover:bg-[#2A2A2A] transition active:scale-95 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setStep(1)}
                className="py-2 px-3 rounded-lg bg-[#141414] border border-white/10 text-neutral-300 font-medium text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBMIT TRANSACTION ID */}
        {step === 3 && (
          <form onSubmit={handleSubmitDeposit} className="space-y-3 py-1">
            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                12-Digit UTR / Transaction ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 432198765432"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400 font-mono text-xs tracking-wider"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#141414] border border-white/5 text-xs">
              <span className="text-neutral-400">Amount:</span>
              <span className="font-heading font-bold text-emerald-400 text-sm">₹{finalAmount}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2 px-3 rounded-lg bg-[#141414] border border-white/10 text-neutral-300 font-medium text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
