export const useTelegram = () => {
  const tg = window.Telegram?.WebApp;

  const initTelegram = () => {
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation?.();
        // Set header color to match our dark light-blue theme
        tg.setHeaderColor?.('#080E1E');
        tg.setBackgroundColor?.('#030712');
      } catch (e) {
        console.warn('[Telegram WebApp] init error:', e);
      }
    }
  };

  const haptic = {
    light: () => tg?.HapticFeedback?.impactOccurred('light'),
    medium: () => tg?.HapticFeedback?.impactOccurred('medium'),
    heavy: () => tg?.HapticFeedback?.impactOccurred('heavy'),
    success: () => tg?.HapticFeedback?.notificationOccurred('success'),
    error: () => tg?.HapticFeedback?.notificationOccurred('error'),
    warning: () => tg?.HapticFeedback?.notificationOccurred('warning'),
    selection: () => tg?.HapticFeedback?.selectionChanged(),
  };

  return {
    tg,
    initTelegram,
    haptic,
    isAvailable: Boolean(tg && tg.initData),
    initData: tg?.initData || '',
    user: tg?.initDataUnsafe?.user || null,
  };
};
