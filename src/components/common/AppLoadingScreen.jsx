import React from 'react';
import { FireLogo } from './FireLogo.jsx';

export const AppLoadingScreen = ({ isVisible, message = 'Preparing circuit & credentials...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#070709] flex flex-col items-center justify-center p-6 text-white select-none transition-opacity duration-300">
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-amber-400/10 blur-[100px] pointer-events-none" />

      <div className="relative flex flex-col items-center space-y-6 max-w-xs text-center z-10 animate-fade-in">
        {/* Glowing Logo Badge */}
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-black/60 border border-white/10 shadow-2xl shadow-amber-500/10 flex items-center justify-center p-4">
            <FireLogo className="w-14 h-14 animate-pulse" />
          </div>
          <div className="absolute -inset-1 rounded-3xl bg-amber-400/20 blur-md -z-10 animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="font-heading font-black text-2xl tracking-widest text-white">
            FIREFLY
          </h1>
          <p className="text-xs text-neutral-400 font-medium">
            {message}
          </p>
        </div>

        {/* Sleek Animated Progress Bar */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full animate-[progress_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
