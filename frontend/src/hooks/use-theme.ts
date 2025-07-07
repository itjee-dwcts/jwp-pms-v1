import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// 타입 정의
// ============================================================================

interface ThemeState {
  isDarkMode: boolean;
  primaryColor: string;
  fontSize: 'sm' | 'md' | 'lg';
  density: 'compact' | 'comfortable' | 'spacious';
}

interface ThemeStore extends ThemeState {
  // Actions
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  setDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
  setTheme: (theme: Partial<ThemeState>) => void;
  resetTheme: () => void;
  getSystemTheme: () => boolean;
  applyTheme: () => void;
  initializeTheme: () => void; // App.tsx에서 사용하는 함수 추가
}

// ============================================================================
// 기본 테마 설정
// ============================================================================

const defaultTheme: ThemeState = {
  isDarkMode: false,
  primaryColor: '#3b82f6', // Blue-500
  fontSize: 'md',
  density: 'comfortable',
};

// 색상 팔레트
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

// ============================================================================
// 유틸리티 함수들
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  } : null;
}

function generateColorVariations(baseColor: { r: number; g: number; b: number }) {
  const variations: Record<string, { r: number; g: number; b: number }> = {};

  // 밝은 변형 생성 (50-400)
  for (let i = 50; i <= 400; i += 50) {
    const factor = 1 - (i / 500) * 0.8;
    variations[i] = {
      r: Math.round(255 - (255 - baseColor.r) * factor),
      g: Math.round(255 - (255 - baseColor.g) * factor),
      b: Math.round(255 - (255 - baseColor.b) * factor),
    };
  }

  // 기본 색상 (500)
  variations[500] = baseColor;

  // 어두운 변형 생성 (600-950)
  for (let i = 600; i <= 950; i += 50) {
    const factor = (i - 500) / 450;
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

// ============================================================================
// Zustand 스토어
// ============================================================================

const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...defaultTheme,

      toggleDarkMode: () => {
        const { isDarkMode } = get();
        const newDarkMode = !isDarkMode;
        set({ isDarkMode: newDarkMode });
        get().applyTheme();

        // 테마 변경 이벤트 발송
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

      setTheme: (theme: Partial<ThemeState>) => {
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
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
      },

      // App.tsx에서 사용하는 초기화 함수 추가
      initializeTheme: () => {
        console.log('🎨 Initializing theme...');
        
        const store = get();
        
        // 저장된 설정이 없다면 시스템 테마로 초기화
        const savedTheme = localStorage.getItem('pms-theme-store');
        if (!savedTheme) {
          const systemDarkMode = store.getSystemTheme();
          set({ isDarkMode: systemDarkMode });
          console.log('🔧 Using system theme:', systemDarkMode ? 'dark' : 'light');
        }
        
        // 테마 적용
        store.applyTheme();
        console.log('✅ Theme initialized:', {
          isDarkMode: store.isDarkMode,
          primaryColor: store.primaryColor,
          fontSize: store.fontSize,
          density: store.density
        });
      },

      applyTheme: () => {
        const { isDarkMode, primaryColor, fontSize, density } = get();

        // 다크 모드 클래스 적용
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // 주색상을 CSS 커스텀 속성으로 적용
        const root = document.documentElement;
        const colorValue = hexToRgb(primaryColor);

        if (colorValue) {
          root.style.setProperty('--color-primary', `${colorValue.r} ${colorValue.g} ${colorValue.b}`);

          // 색상 변형 생성
          const variations = generateColorVariations(colorValue);
          Object.entries(variations).forEach(([key, value]) => {
            root.style.setProperty(`--color-primary-${key}`, `${value.r} ${value.g} ${value.b}`);
          });
        }

        // 폰트 크기 적용
        const fontSizeMap = {
          sm: '14px',
          md: '16px',
          lg: '18px',
        };
        root.style.setProperty('--font-size-base', fontSizeMap[fontSize]);

        // 밀도 적용
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

        // 모바일 브라우저용 메타 테마 색상 업데이트
        updateMetaThemeColor(isDarkMode ? '#1f2937' : '#ffffff');
      },
    }),
    {
      name: 'pms-theme-store',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        primaryColor: state.primaryColor,
        fontSize: state.fontSize,
        density: state.density,
      }),
    }
  )
);

// ============================================================================
// 메인 테마 훅
// ============================================================================

export const useTheme = () => {
  const store = useThemeStore();

  // initializeTheme를 useCallback으로 메모이제이션 (App.tsx에서 사용)
  const initializeTheme = useCallback(() => {
    store.initializeTheme();
  }, [store]);

  // 초기화 로직
  useEffect(() => {
    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // 사용자가 명시적으로 설정하지 않았다면 시스템 테마 따라감
      const savedTheme = localStorage.getItem('pms-theme-store');
      if (!savedTheme) {
        console.log('🔄 System theme changed:', e.matches ? 'dark' : 'light');
        store.setDarkMode(e.matches);
      }
    };

    // 최신 브라우저
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } 
    // 구형 브라우저 지원
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
    // 어떤 경우에도 undefined를 반환하여 모든 경로에서 값을 반환하도록 함
    return undefined;
  }, [store]);

  return {
    ...store,
    initializeTheme, // App.tsx에서 사용하는 메모이제이션된 함수
  };
};

// ============================================================================
// 개별 선택자 훅들 (성능 최적화용)
// ============================================================================

export const useIsDarkMode = () => useThemeStore(state => state.isDarkMode);
export const usePrimaryColor = () => useThemeStore(state => state.primaryColor);
export const useFontSize = () => useThemeStore(state => state.fontSize);
export const useDensity = () => useThemeStore(state => state.density);

// ============================================================================
// 테마 프리셋
// ============================================================================

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

// 테마 프리셋 적용 함수
export const applyThemePreset = (presetName: keyof typeof themePresets) => {
  const { setTheme } = useThemeStore.getState();
  const preset = themePresets[presetName];
  setTheme(preset);
};

// ============================================================================
// 테마 클래스 헬퍼 (편의 함수들)
// ============================================================================

export const getThemeClasses = (isDarkMode: boolean) => ({
  // 배경 클래스
  bg: {
    primary: isDarkMode ? 'bg-gray-900' : 'bg-white',
    secondary: isDarkMode ? 'bg-gray-800' : 'bg-gray-50',
    tertiary: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
    accent: isDarkMode ? 'bg-gray-600' : 'bg-gray-200',
  },

  // 텍스트 클래스
  text: {
    primary: isDarkMode ? 'text-white' : 'text-gray-900',
    secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    tertiary: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    accent: isDarkMode ? 'text-gray-200' : 'text-gray-700',
  },

  // 보더 클래스
  border: {
    primary: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    secondary: isDarkMode ? 'border-gray-600' : 'border-gray-300',
    accent: isDarkMode ? 'border-gray-500' : 'border-gray-400',
  },

  // 포커스 링 클래스
  ring: {
    primary: 'ring-primary-500',
    secondary: isDarkMode ? 'ring-gray-400' : 'ring-gray-500',
  },

  // 호버 상태
  hover: {
    bg: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    text: isDarkMode ? 'hover:text-white' : 'hover:text-gray-900',
  },
});

// 테마 전환 애니메이션 클래스
export const themeTransitionClasses = 'transition-colors duration-200 ease-in-out';

// CSS 커스텀 속성 헬퍼
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

// useThemeClasses 훅 (편의성을 위해 추가)
export const useThemeClasses = () => {
  const isDarkMode = useIsDarkMode();
  return getThemeClasses(isDarkMode);
};