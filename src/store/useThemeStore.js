import { create } from 'zustand';

export const THEMES = {
  blue: {
    id: 'blue',
    name: 'Light Blue',
    hex: '#38BDF8',
    hoverHex: '#0EA5E9',
    bgClass: 'bg-[#38BDF8]',
    borderClass: 'border-[#38BDF8]',
  },
  green: {
    id: 'green',
    name: 'Emerald Green',
    hex: '#10B981',
    hoverHex: '#059669',
    bgClass: 'bg-[#10B981]',
    borderClass: 'border-[#10B981]',
  },
  purple: {
    id: 'purple',
    name: 'Cyber Purple',
    hex: '#A855F7',
    hoverHex: '#9333EA',
    bgClass: 'bg-[#A855F7]',
    borderClass: 'border-[#A855F7]',
  },
  yellow: {
    id: 'yellow',
    name: 'Solar Yellow',
    hex: '#FACC15',
    hoverHex: '#EAB308',
    bgClass: 'bg-[#FACC15]',
    borderClass: 'border-[#FACC15]',
  },
};

const getStoredTheme = () => {
  try {
    const saved = localStorage.getItem('firefly_theme');
    if (saved && THEMES[saved]) return saved;
  } catch (e) {}
  return 'blue';
};

const applyThemeToDOM = (theme) => {
  try {
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
};

// Initial apply
applyThemeToDOM(getStoredTheme());

export const useThemeStore = create((set) => ({
  currentTheme: getStoredTheme(),
  themeConfig: THEMES[getStoredTheme()],

  setTheme: (themeId) => {
    if (!THEMES[themeId]) return;
    try {
      localStorage.setItem('firefly_theme', themeId);
    } catch (e) {}
    applyThemeToDOM(themeId);
    set({
      currentTheme: themeId,
      themeConfig: THEMES[themeId],
    });
  },
}));
