import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Wallet, User } from 'lucide-react';
import { useTelegram } from '../../store/useTelegram.js';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { haptic } = useTelegram();

  const navItems = [
    {
      id: 'tournaments',
      label: 'Tournament',
      path: '/',
      icon: Trophy,
    },
    {
      id: 'wallet',
      label: 'Wallet',
      path: '/wallet',
      icon: Wallet,
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: User,
    },
  ];

  const handleNav = (path) => {
    haptic.selection();
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/' || location.pathname.startsWith('/tournament')
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.path)}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-colors relative ${
                isActive
                  ? 'text-sky-400 font-semibold'
                  : 'text-neutral-400 hover:text-white font-medium'
              } active:scale-90`}
            >
              {/* Clean Active Indicator Pill */}
              {isActive && (
                <span className="absolute -top-2 w-5 h-0.5 rounded-full bg-sky-400" />
              )}
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-white/5 text-sky-400' : 'text-neutral-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
