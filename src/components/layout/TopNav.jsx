import React from 'react';
import { Plus, Shield } from 'lucide-react';
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

          {/* Wallet Balance Pill */}
          <div
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-[#121212] border border-white/10 hover:border-white/20 cursor-pointer transition active:scale-95"
          >
            <span className="font-heading font-bold text-white text-xs">
              ₹{user?.walletBalance !== undefined ? user.walletBalance.toLocaleString('en-IN') : '0'}
            </span>

            {/* Quick Add (+) Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDeposit?.();
              }}
              className="w-6 h-6 rounded-full bg-sky-400 hover:bg-sky-300 text-black flex items-center justify-center transition active:scale-90"
              title="Add Money"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
