import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type Lang, makeT, type T } from './i18n';

export const THEMES = [
  { id: 'tokyonight', name: 'Tokyo Night', colors: ['#1a1b26', '#7aa2f7', '#bb9af7', '#9ece6a'] },
  { id: 'dracula', name: 'Dracula', colors: ['#282a36', '#8be9fd', '#bd93f9', '#50fa7b'] },
  { id: 'mocha', name: 'Catppuccin Mocha', colors: ['#1e1e2e', '#89b4fa', '#cba6f7', '#a6e3a1'] },
  { id: 'nord', name: 'Nord', colors: ['#2e3440', '#81a1c1', '#b48ead', '#a3be8c'] },
  { id: 'onedark', name: 'One Dark', colors: ['#282c34', '#61afef', '#c678dd', '#98c379'] },
  { id: 'gruvbox', name: 'Gruvbox Dark', colors: ['#282828', '#83a598', '#d3869b', '#b8bb26'] },
  { id: 'rosepine', name: 'Rosé Pine', colors: ['#1f1d2e', '#9ccfd8', '#c4a7e7', '#f6c177'] },
  { id: 'solarized', name: 'Solarized Dark', colors: ['#073642', '#268bd2', '#d33682', '#859900'] },
  { id: 'latte', name: 'Catppuccin Latte ☀', colors: ['#eff1f5', '#1e66f5', '#8839ef', '#40a02b'] },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

interface Settings {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  i18n: T;
}

const Ctx = createContext<Settings | null>(null);

const read = <V,>(key: string, fallback: V): V => {
  try {
    return (localStorage.getItem(key) as V | null) ?? fallback;
  } catch {
    return fallback;
  }
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => read('amlich.theme', 'tokyonight' as ThemeId));
  const [lang, setLangState] = useState<Lang>(() => read('amlich.lang', 'vi' as Lang));

  useEffect(() => {
    // tokyonight = bo token mac dinh trong styles.css -> khong can data-theme
    if (theme === 'tokyonight') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('amlich.theme', theme); } catch { /* private mode */ }
    // Thanh trang thai cua he dieu hanh khi cai PWA phai khop theme dang dung
    requestAnimationFrame(() => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#16161e');
    });
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('amlich.lang', lang); } catch { /* private mode */ }
  }, [lang]);

  const value = useMemo<Settings>(
    () => ({ theme, setTheme: setThemeState, lang, setLang: setLangState, i18n: makeT(lang) }),
    [theme, lang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): Settings {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSettings phai nam trong <SettingsProvider>');
  return v;
}

/** Tien: chi lay ham dich cho gon trong component. */
export const useT = (): T => useSettings().i18n;
