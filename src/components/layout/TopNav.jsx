import React from 'react';
import { Plus, Shield, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useNavigate } from 'react-router-dom';
import { FireLogo } from '../common/FireLogo.jsx';

export const TopNav = ({ onOpenDeposit }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo & Website Name */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          {/* Fire SVG Logo - Pure Flame */}
          <div className="flex items-center justify-center transition active:scale-95">
            <FireLogo className="w-6 h-6" />
          </div>

          <span className="font-heading font-black text-white text-base tracking-wider">
            FIREFLY
          </span>
        </div>

        {/* Right Section: Real-time Wallet Balance & Quick Add */}
        <div className="flex items-center gap-2">
          {/* Admin shortcut if admin */}
          {user?.isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="p-1.5 rounded-lg bg-[#141414] border border-white/10 text-sky-400 hover:bg-[#1A1A1A] transition"
              title="Admin Panel"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          {/* Wallet Balance Button (Enlarged with comfortable hit area) */}
          <button
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 hover:border-white/25 active:scale-95 transition"
            title="Open Wallet"
          >
            <Wallet className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-heading font-bold text-white text-xs sm:text-sm">
              ₹{user?.walletBalance !== undefined ? user.walletBalance.toLocaleString('en-IN') : '0'}
            </span>
          </button>

          {/* Separate Quick Add (+) Button */}
          <button
            onClick={onOpenDeposit}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-400 hover:bg-sky-300 text-black flex items-center justify-center transition active:scale-90 flex-shrink-0 shadow-sm"
            title="Add Money"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </header>
  );
};
