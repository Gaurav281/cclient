// Static stable haptic object reference to prevent component re-render cascading
const staticHaptic = {
  light: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'),
  medium: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'),
  heavy: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy'),
  success: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'),
  error: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'),
  warning: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning'),
  selection: () => window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(),
};

export const useTelegram = () => {
  const tg = window.Telegram?.WebApp;

  const initTelegram = () => {
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation?.();
        // Set header color to match our dark theme
        tg.setHeaderColor?.('#080E1E');
        tg.setBackgroundColor?.('#030712');
      } catch (e) {
        console.warn('[Telegram WebApp] init error:', e);
      }
    }
  };

  return {
    tg,
    initTelegram,
    haptic: staticHaptic,
    isAvailable: Boolean(tg && tg.initData),
    initData: tg?.initData || '',
    user: tg?.initDataUnsafe?.user || null,
  };
};
