import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
      },

      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// 시스템 테마 감지 및 자동 설정
export const initializeTheme = () => {
  const { theme, setTheme } = useThemeStore.getState();

  // 저장된 테마가 없으면 시스템 테마 사용
  if (!theme) {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(systemPrefersDark ? 'dark' : 'light');
  }

  // 시스템 테마 변경 감지
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // 사용자가 수동으로 테마를 설정하지 않은 경우에만 자동 변경
    const currentTheme = useThemeStore.getState().theme;
    if (!localStorage.getItem('theme-storage')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
};
