import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore.js';
import { useTelegram } from './store/useTelegram.js';

// Layout & Components
import { TopNav } from './components/layout/TopNav.jsx';
import { BottomNav } from './components/layout/BottomNav.jsx';
import { DepositModal } from './components/wallet/DepositModal.jsx';

// Pages
import { TournamentsPage } from './pages/TournamentsPage.jsx';
import { TournamentDetailPage } from './pages/TournamentDetailPage.jsx';
import { PlayGamePage } from './pages/PlayGamePage.jsx';
import { WalletPage } from './pages/WalletPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';

// Initialize TanStack Query Client with optimal caching & mobile network efficiency
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 20, // 20 seconds fresh cache
      gcTime: 1000 * 60 * 5, // 5 minutes garbage collection
      refetchOnWindowFocus: false, // Prevent redundant refetches on TMA modal/keyboard focus
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

function AppContent() {
  const location = useLocation();
  const { initAuth, isLoading, user } = useAuthStore();
  const { initTelegram } = useTelegram();
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  // Initialize Telegram & Authenticate on App Mount
  useEffect(() => {
    initTelegram();
    initAuth();
  }, []);

  // In full-screen game mode, hide top and bottom navbars
  const isGameRoute =
    location.pathname.endsWith('/play') || location.pathname === '/play';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-sky-500 selection:text-black">
      {/* Top Navbar */}
      {!isGameRoute && <TopNav onOpenDeposit={() => setIsDepositOpen(true)} />}

      {/* Main Page Container */}
      <main className={`flex-1 w-full ${!isGameRoute ? 'max-w-md mx-auto px-4 pt-3' : ''}`}>
        <Routes>
          <Route
            path="/"
            element={<TournamentsPage onOpenDeposit={() => setIsDepositOpen(true)} />}
          />
          <Route
            path="/tournament/:tournamentId"
            element={<TournamentDetailPage onOpenDeposit={() => setIsDepositOpen(true)} />}
          />
          <Route path="/tournament/:tournamentId/play" element={<PlayGamePage />} />
          <Route path="/play" element={<PlayGamePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="*"
            element={<TournamentsPage onOpenDeposit={() => setIsDepositOpen(true)} />}
          />
        </Routes>
      </main>

      {/* Bottom Navbar */}
      {!isGameRoute && <BottomNav />}

      {/* Global Deposit Modal Trigger */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#121212',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
