// src/store/authStore.ts

import toast from 'react-hot-toast';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../lib/api';
import { LoginRequest, User, UserCreateRequest } from '../types';

interface AuthState {
  // 상태
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 액션
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: UserCreateRequest) => Promise<boolean>;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 로그인
      login: async (credentials: LoginRequest): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.login(credentials);

          const { access_token, refresh_token, user } = response;

          // 토큰을 localStorage에 저장
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          set({
            user,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          toast.success(`환영합니다, ${user.first_name}님!`);
          return true;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || '로그인에 실패했습니다.';
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          toast.error(errorMessage);
          return false;
        }
      },

      // 회원가입
      register: async (userData: UserCreateRequest): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          await apiClient.register(userData);

          set({
            isLoading: false,
            error: null,
          });

          toast.success('회원가입이 완료되었습니다. 로그인해주세요.');
          return true;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || '회원가입에 실패했습니다.';
          set({
            isLoading: false,
            error: errorMessage,
          });
          toast.error(errorMessage);
          return false;
        }
      },

      // 로그아웃
      logout: () => {
        // API 호출 (선택적)
        apiClient.logout().catch(() => {
          // 로그아웃 API 실패해도 로컬 상태는 정리
        });

        // 로컬 스토리지 정리
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        toast.success('로그아웃되었습니다.');
      },

      // 토큰 갱신
      refreshTokens: async (): Promise<boolean> => {
        const { refreshToken } = get();

        if (!refreshToken) {
          get().logout();
          return false;
        }

        try {
          const response = await apiClient.refreshToken(refreshToken);
          const { access_token, refresh_token, user } = response;

          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          set({
            user,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            error: null,
          });

          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      // 현재 사용자 정보 가져오기
      getCurrentUser: async (): Promise<void> => {
        const { token } = get();

        if (!token) {
          return;
        }

        set({ isLoading: true });

        try {
          const response = await apiClient.getCurrentUser();

          set({
            user: response.data,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          if (error.response?.status === 401) {
            // 토큰이 유효하지 않은 경우 로그아웃
            get().logout();
          } else {
            set({
              isLoading: false,
              error: '사용자 정보를 가져오는데 실패했습니다.',
            });
          }
        }
      },

      // 에러 초기화
      clearError: () => {
        set({ error: null });
      },

      // 로딩 상태 설정
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 인증 초기화 함수 (앱 시작 시 호출)
export const initializeAuth = async (): Promise<void> => {
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (token && refreshToken) {
    useAuthStore.setState({
      token,
      refreshToken,
      isAuthenticated: true,
    });

    // 현재 사용자 정보 가져오기
    await useAuthStore.getState().getCurrentUser();
  }
};

// 인증이 필요한 라우트에서 사용할 훅
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  return {
    isAuthenticated,
    isLoading,
    requireAuth: isAuthenticated,
  };
};

// 권한 체크 훅
export const usePermissions = () => {
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;
  const isDeveloper = user?.role === 'developer' || isManager;

  const canManageUsers = isAdmin;
  const canManageProjects = isManager;
  const canCreateTasks = isDeveloper;
  const canDeleteTasks = isManager;
  const canViewReports = isManager;

  return {
    isAdmin,
    isManager,
    isDeveloper,
    canManageUsers,
    canManageProjects,
    canCreateTasks,
    canDeleteTasks,
    canViewReports,
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => roles.includes(user?.role || ''),
  };
};
