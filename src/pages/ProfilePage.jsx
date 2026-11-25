import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { authApi } from '../api/authApi.js';
import { checkServerHealth } from '../api/client.js';
import { useThemeStore, THEMES } from '../store/useThemeStore.js';
import {
  Trophy,
  Wallet,
  Gamepad2,
  Sparkles,
  Bot,
  CreditCard,
  CheckCircle2,
  Save,
  Palette,
  Check,
  Server,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTelegram } from '../store/useTelegram.js';

export const ProfilePage = () => {
  const { user, setSavedUpiId } = useAuthStore();
  const { haptic } = useTelegram();
  const { currentTheme, setTheme } = useThemeStore();

  const [upiInput, setUpiInput] = useState('');
  const [isSavingUpi, setIsSavingUpi] = useState(false);

  // Clean System status (Green 🟢 / Red 🔴 light only, no text clutter)
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'online' | 'sleeping'

  const pingServer = useCallback(async () => {
    try {
      const res = await checkServerHealth(4000);
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('sleeping');
      }
    } catch (err) {
      setServerStatus('sleeping');
    }
  }, []);

  useEffect(() => {
    pingServer();
    // 14-minute client keep-alive interval if user keeps tab open
    const interval = setInterval(pingServer, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pingServer]);

  useEffect(() => {
    if (user?.savedUpiId) {
      setUpiInput(user.savedUpiId);
    }
  }, [user?.savedUpiId]);

  const handleSaveUpi = async (e) => {
    e.preventDefault();
    const cleanUpi = upiInput.trim();

    if (!cleanUpi || !cleanUpi.includes('@')) {
      toast.error('Enter valid UPI ID (e.g. name@okaxis)');
      haptic.error();
      return;
    }

    setIsSavingUpi(true);
    try {
      const res = await authApi.updateSavedUpi(cleanUpi);
      setSavedUpiId(cleanUpi);
      toast.success(res.message || 'UPI ID saved!');
      haptic.success();
    } catch (err) {
      toast.error(err.message || 'Failed to save UPI ID');
      haptic.error();
    } finally {
      setIsSavingUpi(false);
    }
  };

  const displayName = user
    ? user.username
      ? `@${user.username}`
      : `${user.firstName || 'Player'} ${user.lastName || ''}`.trim()
    : 'Player';

  return (
    <div className="space-y-3 pb-24 animate-fade-in">
      {/* Profile Header */}
      <div className="rounded-xl p-4 theme-card text-center space-y-2.5">
        <div className="relative inline-block mx-auto">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={displayName}
              className="w-14 h-14 rounded-full border border-white/20 object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#181818] border border-white/15 flex items-center justify-center font-heading font-bold text-lg text-white">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : '🏎️'}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-heading font-bold text-base text-white">
            {displayName}
          </h2>
          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
            ID: {user?.telegramId || '123456789'}
          </p>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-medium text-neutral-300 mt-1.5">
            <Bot className="w-3 h-3 text-sky-400" /> @FireflyPlayBot
          </div>
        </div>
      </div>

      {/* Saved UPI ID Card */}
      <div className="rounded-xl p-3.5 theme-card space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-sky-400" />
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-neutral-300">
              Payout UPI ID
            </h3>
          </div>
          {user?.savedUpiId && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSaveUpi} className="space-y-2">
          <input
            type="text"
            required
            placeholder="e.g. yourname@okhdfcbank"
            value={upiInput}
            onChange={(e) => setUpiInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-neutral-500 font-mono text-xs focus:outline-none focus:border-sky-400 transition"
          />

          <button
            type="submit"
            disabled={isSavingUpi}
            className="w-full py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSavingUpi ? 'Saving...' : user?.savedUpiId ? 'Update UPI ID' : 'Save UPI ID'}
          </button>
        </form>
      </div>

      {/* Theme Accent Customization */}
      <div className="rounded-xl p-3.5 theme-card space-y-3">
        <div className="flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-sky-400" />
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-neutral-300">
            Accent Theme
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Object.values(THEMES).map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setTheme(theme.id);
                  haptic.selection();
                  toast.success(`Theme switched to ${theme.name}`);
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition active:scale-95 ${
                  isSelected
                    ? 'bg-[#181818] border-white/40 ring-1 ring-white/20'
                    : 'bg-[#121212] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: theme.hex }}
                  />
                  <span className="text-[11px] font-semibold text-white truncate">
                    {theme.name.replace('Light ', '').replace('Emerald ', '').replace('Solar ', '')}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-sky-400 stroke-[3] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* System Status (Clean Green 🟢 / Red 🔴 light only, no info text) */}
      <div
        onClick={() => {
          haptic.selection();
          pingServer();
        }}
        className="rounded-xl p-3 theme-card flex items-center justify-between cursor-pointer active:scale-[0.99] transition select-none"
      >
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-400" />
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-neutral-300">
            System Status
          </span>
        </div>

        {/* Pure Glowing Indicator Light: Always Red Light as requested */}
        <div className="flex items-center pr-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_#EF4444]" />
          </span>
        </div>
      </div>

      {/* Career Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Wallet Balance */}
        <div className="p-3 rounded-xl theme-card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Balance</span>
          </div>
          <div className="font-heading font-bold text-lg text-emerald-400">
            ₹{user?.walletBalance !== undefined ? user.walletBalance.toLocaleString('en-IN') : 0}
          </div>
        </div>

        {/* Total Earnings */}
        <div className="p-3 rounded-xl theme-card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <Trophy className="w-3.5 h-3.5 text-sky-400" />
            <span>Earnings</span>
          </div>
          <div className="font-heading font-bold text-lg text-sky-400">
            ₹{user?.totalEarnings !== undefined ? user.totalEarnings.toLocaleString('en-IN') : 0}
          </div>
        </div>

        {/* Tournaments Played */}
        <div className="p-3 rounded-xl theme-card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <Gamepad2 className="w-3.5 h-3.5 text-neutral-300" />
            <span>Tournaments</span>
          </div>
          <div className="font-heading font-bold text-lg text-white">
            {user?.tournamentsPlayed || 0}
          </div>
        </div>

        {/* High Score */}
        <div className="p-3 rounded-xl theme-card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>High Score</span>
          </div>
          <div className="font-heading font-bold text-lg text-amber-400">
            {user?.highestGameScore || 0}
          </div>
        </div>
      </div>
    </div>
  );
};
