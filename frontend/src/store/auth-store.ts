// ============================================================================
// store/auth-store.ts - 핵심 상태 관리
// ============================================================================

import { authService } from '@/services/auth-service';
import { LoginRequest, RegisterRequest, User } from '@/types';
import { toast } from 'react-hot-toast';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // 핵심 인증 액션들
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuthStatus: () => Promise<void>;

  // 상태 관리
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 액션들 - authService 위임
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login(credentials);

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          toast.success(`Welcome back, ${response.user.firstName}!`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await authService.logout();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });

          toast.success('Logged out successfully');
        } catch (error) {
          set({ isLoading: false });
          console.error('Logout error:', error);
        }
      },

      // 기타 액션들...
      register: async (userData: RegisterRequest) => { /* ... */ },
      updateProfile: async (data: Partial<User>) => { /* ... */ },
      checkAuthStatus: async () => { /* ... */ },
      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
