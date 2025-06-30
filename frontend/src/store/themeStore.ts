import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeState, ThemeConfig } from '@/types';
import { APP_CONSTANTS } from '@/lib/config';

interface ThemeStore extends ThemeState {
  // Actions
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  setDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  getSystemTheme: () => boolean;
  applyTheme: () => void;
}

// Default theme configuration
const defaultTheme: ThemeState = {
  isDarkMode: false,
  primaryColor: '#3b82f6', // Blue-500
  fontSize: 'md',
  density: 'comfortable',
};

// Predefined color palette
export const colorPalette = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#10b981',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#f59e0b',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
  cyan: '#06b6d4',
} as const;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...defaultTheme,

      toggleDarkMode: () => {
        const { isDarkMode } = get();
        const newDarkMode = !isDarkMode;

        set({ isDarkMode: newDarkMode });

        // Apply theme immediately
        get().applyTheme();

        // Dispatch custom event for theme change
        window.dispatchEvent(new CustomEvent('themeChange', {
          detail: { isDarkMode: newDarkMode }
        }));
      },

      setDarkMode: (isDark: boolean) => {
        set({ isDarkMode: isDark });
        get().applyTheme();

        window.dispatchEvent(new CustomEvent('themeChange', {
          detail: { isDarkMode: isDark }
        }));
      },

      setPrimaryColor: (color: string) => {
        set({ primaryColor: color });
        get().applyTheme();

        window.dispatchEvent(new CustomEvent('themeChange', {
          detail: { primaryColor: color }
        }));
      },

      setFontSize: (size: 'sm' | 'md' | 'lg') => {
        set({ fontSize: size });
        get().applyTheme();

        window.dispatchEvent(new CustomEvent('themeChange', {
          detail: { fontSize: size }
        }));
      },

      setDensity: (density: 'compact' | 'comfortable' | 'spacious') => {
        set({ density });
        get().applyTheme();

        window.dispatchEvent(new CustomEvent('themeChange', {
          detail: { density }
        }));
      },

      setTheme: (theme: Partial<ThemeConfig>) => {
        const currentState = get();
        const newState = { ...currentState, ...theme };

        set(newState);
        get().applyTheme();

        window.dispatchEvent(new CustomEvent('themeChange', {
          detail: theme
        }));
      },

      resetTheme: () => {
        set(defaultTheme);
        get().applyTheme();

        window.dispatchEvent(new CustomEvent('themeChange', {
          detail: { reset: true }
        }));
      },

      getSystemTheme: () => {
        if (typeof window === 'undefined') return false;

        return window.matchMedia &&
               window.matchMedia('(prefers-color-scheme: dark)').matches;
      },

      applyTheme: () => {
        const { isDarkMode, primaryColor, fontSize, density } = get();

        // Apply dark mode class
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Apply primary color as CSS custom property
        const root = document.documentElement;
        const colorValue = hexToRgb(primaryColor);

        if (colorValue) {
          root.style.setProperty('--color-primary', `${colorValue.r} ${colorValue.g} ${colorValue.b}`);

          // Generate color variations
          const variations = generateColorVariations(colorValue);
          Object.entries(variations).forEach(([key, value]) => {
            root.style.setProperty(`--color-primary-${key}`, `${value.r} ${value.g} ${value.b}`);
          });
        }

        // Apply font size
        const fontSizeMap = {
          sm: '14px',
          md: '16px',
          lg: '18px',
        };
        root.style.setProperty('--font-size-base', fontSizeMap[fontSize]);

        // Apply density
        const densityMap = {
          compact: {
            spacing: '0.5rem',
            padding: '0.5rem',
            height: '2rem',
          },
          comfortable: {
            spacing: '0.75rem',
            padding: '0.75rem',
            height: '2.5rem',
          },
          spacious: {
            spacing: '1rem',
            padding: '1rem',
            height: '3rem',
          },
        };

        const densityValues = densityMap[density];
        Object.entries(densityValues).forEach(([key, value]) => {
          root.style.setProperty(`--density-${key}`, value);
        });

        // Update meta theme color for mobile browsers
        updateMetaThemeColor(isDarkMode ? '#1f2937' : '#ffffff');
      },
    }),
    {
      name: APP_CONSTANTS.THEME_STORAGE_KEY,
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        primaryColor: state.primaryColor,
        fontSize: state.fontSize,
        density: state.density,
      }),
    }
  )
);

// Utility functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function generateColorVariations(baseColor: { r: number; g: number; b: number }) {
  const variations: Record<string, { r: number; g: number; b: number }> = {};

  // Generate lighter variations (50-400)
  for (let i = 50; i <= 400; i += 50) {
    const factor = 1 - (i / 500) * 0.8; // Reduce intensity
    variations[i] = {
      r: Math.round(255 - (255 - baseColor.r) * factor),
      g: Math.round(255 - (255 - baseColor.g) * factor),
      b: Math.round(255 - (255 - baseColor.b) * factor),
    };
  }

  // Base color (500)
  variations[500] = baseColor;

  // Generate darker variations (600-950)
  for (let i = 600; i <= 950; i += 50) {
    const factor = (i - 500) / 450; // 0 to 1
    variations[i] = {
      r: Math.round(baseColor.r * (1 - factor * 0.8)),
      g: Math.round(baseColor.g * (1 - factor * 0.8)),
      b: Math.round(baseColor.b * (1 - factor * 0.8)),
    };
  }

  return variations;
}

function updateMetaThemeColor(color: string): void {
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');

  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }

  metaThemeColor.setAttribute('content', color);
}

// Selectors
export const useIsDarkMode = () => useThemeStore(state => state.isDarkMode);
export const usePrimaryColor = () => useThemeStore(state => state.primaryColor);
export const useFontSize = () => useThemeStore(state => state.fontSize);
export const useDensity = () => useThemeStore(state => state.density);

// Theme initialization hook
export const useThemeInit = () => {
  const { applyTheme, getSystemTheme, setDarkMode } = useThemeStore();

  React.useEffect(() => {
    // Apply saved theme on mount
    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't explicitly set a preference
      const savedTheme = localStorage.getItem(APP_CONSTANTS.THEME_STORAGE_KEY);
      if (!savedTheme) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Set initial system theme if no saved preference
    const savedTheme = localStorage.getItem(APP_CONSTANTS.THEME_STORAGE_KEY);
    if (!savedTheme) {
      setDarkMode(getSystemTheme());
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);
};

// Theme context for easier consumption
export const ThemeContext = React.createContext<{
  isDarkMode: boolean;
  primaryColor: string;
  fontSize: 'sm' | 'md' | 'lg';
  density: 'compact' | 'comfortable' | 'spacious';
  toggleDarkMode: () => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  setDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
}>({
  isDarkMode: false,
  primaryColor: '#3b82f6',
  fontSize: 'md',
  density: 'comfortable',
  toggleDarkMode: () => {},
  setPrimaryColor: () => {},
  setFontSize: () => {},
  setDensity: () => {},
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useThemeStore();

  return (
    <ThemeContext.Provider value={store}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme class helpers
export const getThemeClasses = (isDarkMode: boolean) => ({
  // Background classes
  bg: {
    primary: isDarkMode ? 'bg-gray-900' : 'bg-white',
    secondary: isDarkMode ? 'bg-gray-800' : 'bg-gray-50',
    tertiary: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
    accent: isDarkMode ? 'bg-gray-600' : 'bg-gray-200',
  },

  // Text classes
  text: {
    primary: isDarkMode ? 'text-white' : 'text-gray-900',
    secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    tertiary: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    accent: isDarkMode ? 'text-gray-200' : 'text-gray-700',
  },

  // Border classes
  border: {
    primary: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    secondary: isDarkMode ? 'border-gray-600' : 'border-gray-300',
    accent: isDarkMode ? 'border-gray-500' : 'border-gray-400',
  },

  // Ring classes for focus states
  ring: {
    primary: 'ring-primary-500',
    secondary: isDarkMode ? 'ring-gray-400' : 'ring-gray-500',
  },

  // Hover states
  hover: {
    bg: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    text: isDarkMode ? 'hover:text-white' : 'hover:text-gray-900',
  },
});

// Animation classes for theme transitions
export const themeTransitionClasses = 'transition-colors duration-200 ease-in-out';

// CSS custom properties helper
export const getCSSCustomProperties = () => {
  const root = document.documentElement;
  const style = getComputedStyle(root);

  return {
    primaryColor: style.getPropertyValue('--color-primary').trim(),
    fontSize: style.getPropertyValue('--font-size-base').trim(),
    densitySpacing: style.getPropertyValue('--density-spacing').trim(),
    densityPadding: style.getPropertyValue('--density-padding').trim(),
    densityHeight: style.getPropertyValue('--density-height').trim(),
  };
};

// Predefined theme presets
export const themePresets = {
  default: {
    primaryColor: '#3b82f6',
    fontSize: 'md' as const,
    density: 'comfortable' as const,
  },
  compact: {
    primaryColor: '#6366f1',
    fontSize: 'sm' as const,
    density: 'compact' as const,
  },
  spacious: {
    primaryColor: '#10b981',
    fontSize: 'lg' as const,
    density: 'spacious' as const,
  },
  corporate: {
    primaryColor: '#1f2937',
    fontSize: 'md' as const,
    density: 'comfortable' as const,
  },
  creative: {
    primaryColor: '#ec4899',
    fontSize: 'md' as const,
    density: 'spacious' as const,
  },
} as const;

// Apply theme preset
export const applyThemePreset = (presetName: keyof typeof themePresets) => {
  const { setTheme } = useThemeStore.getState();
  const preset = themePresets[presetName];
  setTheme(preset);
};

// Export React import for the hooks
import React from 'react';
