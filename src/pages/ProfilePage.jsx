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

  // System status & Render free plan 40s wake monitor
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'online' | 'sleeping'
  const [latency, setLatency] = useState(null);
  const [wakeTimer, setWakeTimer] = useState(40);
  const [isWaking, setIsWaking] = useState(false);
  const wakeIntervalRef = useRef(null);

  const startWakeupFlow = useCallback(() => {
    setIsWaking(true);
    setServerStatus('sleeping');
    setWakeTimer(40);

    if (wakeIntervalRef.current) clearInterval(wakeIntervalRef.current);

    // Keep active request so Render receives wake-up traffic
    checkServerHealth(60000)
      .then((res) => {
        setServerStatus('online');
        setLatency(res.latency);
        setIsWaking(false);
        if (wakeIntervalRef.current) clearInterval(wakeIntervalRef.current);
        toast.success('Backend server is online & active!');
        haptic.success();
      })
      .catch(() => {});

    let remaining = 40;
    wakeIntervalRef.current = setInterval(async () => {
      remaining -= 1;
      setWakeTimer(Math.max(0, remaining));

      try {
        const quick = await checkServerHealth(2500);
        if (quick.ok) {
          clearInterval(wakeIntervalRef.current);
          setServerStatus('online');
          setLatency(quick.latency);
          setIsWaking(false);
          toast.success('Backend server is online & active!');
          haptic.success();
          return;
        }
      } catch (e) {}

      if (remaining <= 0) {
        clearInterval(wakeIntervalRef.current);
        setIsWaking(false);
      }
    }, 1000);
  }, [haptic]);

  const pingServer = useCallback(async () => {
    setServerStatus('checking');
    try {
      const res = await checkServerHealth(3500);
      if (res.ok) {
        setServerStatus('online');
        setLatency(res.latency);
        setIsWaking(false);
        if (wakeIntervalRef.current) clearInterval(wakeIntervalRef.current);
        return;
      }
    } catch (err) {
      startWakeupFlow();
    }
  }, [startWakeupFlow]);

  useEffect(() => {
    pingServer();
    return () => {
      if (wakeIntervalRef.current) clearInterval(wakeIntervalRef.current);
    };
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

      {/* System Status (Render Free Plan Monitor & 40s Wakeup Timer) */}
      <div className="rounded-xl p-3.5 theme-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Server className="w-4 h-4 text-sky-400" />
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-neutral-300">
              System Status
            </h3>
          </div>

          {/* Green / Red Indicator Light */}
          <div className="flex items-center gap-1.5">
            {serverStatus === 'online' ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
                Online {latency ? `(${latency}ms)` : ''}
              </span>
            ) : serverStatus === 'sleeping' ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Sleeping (Idle &gt; 15m)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-[10px] font-medium">
                <RefreshCw className="w-2.5 h-2.5 animate-spin text-sky-400" />
                Checking...
              </span>
            )}
          </div>
        </div>

        {/* Status Details / 40s Countdown Box */}
        {serverStatus === 'sleeping' ? (
          <div className="p-3 rounded-lg bg-[#141414] border border-red-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Waking up Render backend...
              </span>
              <span className="font-mono font-bold text-sky-400 text-sm">
                {wakeTimer}s
              </span>
            </div>

            {/* 40-second animated progress bar */}
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, ((40 - wakeTimer) / 40) * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              Render free tier sleeps after 15m idle. Server typically boots in ~40 seconds.
            </p>
          </div>
        ) : serverStatus === 'online' ? (
          <div className="p-2.5 rounded-lg bg-[#141414] border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              <span className="text-neutral-300 text-[11px]">API Server & Database Active</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-400">
              {latency ? `${latency}ms latency` : 'Connected'}
            </span>
          </div>
        ) : null}

        {/* Action Button: Check / Wake Server */}
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            pingServer();
          }}
          disabled={isWaking}
          className="w-full py-2 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 text-white font-heading font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isWaking ? 'animate-spin text-sky-400' : 'text-neutral-400'}`} />
          <span>{serverStatus === 'sleeping' ? 'Waking Up Server...' : 'Check Server Status'}</span>
        </button>
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
