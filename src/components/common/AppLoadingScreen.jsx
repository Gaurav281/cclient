import React from 'react';
import { FireLogo } from './FireLogo.jsx';

export const AppLoadingScreen = ({ isVisible, message = 'Preparing circuit & credentials...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090A0D] flex flex-col items-center justify-between p-8 text-white select-none transition-opacity duration-300 font-sans">
      {/* Top Brand Tag */}
      <div className="pt-6 flex items-center gap-2 text-[10px] uppercase font-mono tracking-[0.3em] text-neutral-500">
        <span>FIREFLY RACING</span>
      </div>

      {/* Center Emblem & Status */}
      <div className="flex flex-col items-center space-y-7 max-w-xs text-center z-10 w-full animate-fade-in">
        {/* Luxury Matte Emblem Badge - Bigger & Better Fire Flame */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#131418] border border-white/[0.12] shadow-2xl flex items-center justify-center p-4 transition-all">
          <FireLogo
            className="w-18 h-18 sm:w-20 sm:h-20 animate-[pulseSubtle_2.8s_ease-in-out_infinite]"
            outerColor="#F59E0B"
            innerColor="#FEF3C7"
          />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <h1 className="font-heading font-black text-2xl tracking-[0.2em] text-white">
            FIREFLY
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400">
            COMPETE &bull; COLLECT &bull; WIN
          </p>
        </div>

        {/* Sleek Minimalist Progress Bar (Matte Obsidian Track & Crisp White Bar) */}
        <div className="w-48 space-y-2.5">
          <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden relative">
            <div className="h-full bg-white rounded-full animate-[progress_1.3s_ease-in-out_infinite]" />
          </div>
          <p className="text-[11px] text-neutral-400 font-medium tracking-wide">
            {message}
          </p>
        </div>
      </div>

      {/* Clean Bottom Footer */}
      <div className="pb-4 text-[10px] font-mono text-neutral-600 tracking-widest uppercase">
        SECURE TELEGRAM PROTOCOL
      </div>
    </div>
  );
};
