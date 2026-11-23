import { create } from 'zustand';
import { authApi } from '../api/authApi.js';
import { getAuthToken, setAuthToken } from '../api/client.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: getAuthToken(),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    set({ isLoading: true, error: null });
    const tg = window.Telegram?.WebApp;
    const tgInitData = tg?.initData;

    try {
      // 1. If opened inside Telegram, automatically log in with initData
      if (tgInitData) {
        console.log('[Auth] Authenticating via Telegram WebApp initData...');
        const res = await authApi.loginWithTelegram(tgInitData);
        set({
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      // 2. If token already exists in localStorage, verify and fetch user
      const existingToken = getAuthToken();
      if (existingToken) {
        try {
          const res = await authApi.getMe();
          set({
            user: res.user,
            token: existingToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        } catch (err) {
          console.warn('[Auth] Stored token invalid, clearing...', err);
          setAuthToken(null);
        }
      }

      // 3. Fallback: If in browser outside Telegram, auto-login with dev/demo profile
      console.log('[Auth] Running outside Telegram: Auto-authenticating in Demo Mode');
      const devRes = await authApi.devLogin();
      set({
        user: devRes.user,
        token: devRes.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      console.error('[Auth] Init error:', err);
      set({
        error: err.message,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  refreshUser: async () => {
    try {
      const res = await authApi.getMe();
      set({ user: res.user });
      return res.user;
    } catch (err) {
      console.error('[Auth] Refresh user error:', err);
    }
  },

  updateWalletBalance: (newBalance) => {
    set((state) => ({
      user: state.user ? { ...state.user, walletBalance: newBalance } : null,
    }));
  },

  setSavedUpiId: (savedUpiId) => {
    set((state) => ({
      user: state.user ? { ...state.user, savedUpiId } : null,
    }));
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
