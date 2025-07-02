import { authService } from '@/services/auth-service';
import type {
    AuthActions,
    AuthState,
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    UpdateProfileRequest,
    User
} from '@/types/auth';
import { tokenStorage } from '@/utils/token-storage';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Zustand store 타입 (AuthState + AuthActions 결합)
type AuthStore = AuthState & AuthActions;

// Zustand store
const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ============================================================================
      // 초기 상태 (AuthState 구현)
      // ============================================================================
      user: null,
      isAuthenticated: false,
      isLoading: true, // 초기에는 인증 상태 확인 중
      error: null,

      // ============================================================================
      // 상태 설정 액션들
      // ============================================================================
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      // ============================================================================
      // 인증 관련 액션들 (AuthActions 구현)
      // ============================================================================

      // 로그인
      login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login(credentials);

          // 토큰 저장
          tokenStorage.setTokens(response.access_token, response.refresh_token);

          // 사용자 정보 설정
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          toast.success('로그인되었습니다.');
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
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

      // 회원가입
      register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.register(userData);

          // 회원가입 후 자동 로그인 처리 (토큰이 있는 경우)
          if (response.access_token && response.refresh_token) {
            tokenStorage.setTokens(response.access_token, response.refresh_token);
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            toast.success('회원가입이 완료되었습니다.');
          } else {
            // 이메일 인증 등이 필요한 경우
            set({ isLoading: false });
            toast.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
          }

          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      // 로그아웃
      logout: async (): Promise<void> => {
        try {
          set({ isLoading: true });

          // 서버에 로그아웃 요청
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // 로컬 상태 정리
          tokenStorage.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          toast.success('로그아웃되었습니다.');
        }
      },

      // 토큰 갱신
      refreshToken: async (token?: string): Promise<boolean> => {
        try {
          const refreshToken = token || tokenStorage.getRefreshToken();
          if (!refreshToken) {
            return false;
          }

          const response = await authService.refreshToken(refreshToken);

          // 새 토큰 저장
          tokenStorage.setTokens(response.access_token, response.refresh_token);

          // 사용자 정보 업데이트 (필요한 경우)
          if (response.user) {
            set({ user: response.user });
          }

          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);

          // 토큰 갱신 실패 시 로그아웃 처리
          tokenStorage.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });

          return false;
        }
      },

      // ============================================================================
      // 사용자 관리
      // ============================================================================

      // 프로필 업데이트
      updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
        try {
          set({ isLoading: true, error: null });

          const updatedUser = await authService.updateProfile(data);

          set({
            user: updatedUser,
            isLoading: false,
            error: null
          });

          toast.success('프로필이 업데이트되었습니다.');
          return updatedUser;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      // 비밀번호 변경
      changePassword: async (data: ChangePasswordRequest): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          await authService.changePassword(data);

          set({
            isLoading: false,
            error: null
          });

          toast.success('비밀번호가 변경되었습니다.');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      // ============================================================================
      // 비밀번호 재설정
      // ============================================================================

      // 비밀번호 재설정 요청 (이름 통일)
      requestPasswordReset: async (email: string): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          await authService.requestPasswordReset(email);

          set({
            isLoading: false,
            error: null
          });

          toast.success('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '비밀번호 재설정 요청에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      // 비밀번호 재설정
      resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          await authService.resetPassword(data);

          set({
            isLoading: false,
            error: null
          });

          toast.success('비밀번호가 재설정되었습니다.');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '비밀번호 재설정에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      // ============================================================================
      // 이메일 인증
      // ============================================================================

      verifyEmail: async (token: string): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          await authService.verifyEmail(token);

          // 현재 사용자 정보 새로고침
          const user = await get().getCurrentUser();

          set({
            user,
            isLoading: false,
            error: null
          });

          toast.success('이메일이 인증되었습니다.');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '이메일 인증에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      resendVerificationEmail: async (): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          await authService.resendVerificationEmail();

          set({
            isLoading: false,
            error: null
          });

          toast.success('인증 이메일이 재전송되었습니다.');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '이메일 재전송에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      // ============================================================================
      // OAuth
      // ============================================================================

      getOAuthUrl: (provider: string): string => {
        return authService.getOAuthUrl(provider as 'google' | 'github' | 'microsoft');
      },

      handleOAuthCallback: async (provider: string, code: string, state?: string): Promise<LoginResponse> => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.handleOAuthCallback(provider, code, state);

          // 토큰 저장
          tokenStorage.setTokens(response.access_token, response.refresh_token);

          // 사용자 정보 설정
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          toast.success('로그인되었습니다.');
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'OAuth 로그인에 실패했습니다.';
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

      // ============================================================================
      // 2FA
      // ============================================================================

      enable2FA: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.enable2FA();

          set({
            isLoading: false,
            error: null
          });

          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '2FA 설정에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      disable2FA: async (code: string): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          await authService.disable2FA(code);

          set({
            isLoading: false,
            error: null
          });

          toast.success('2FA가 비활성화되었습니다.');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '2FA 비활성화에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      verify2FA: async (code: string): Promise<LoginResponse> => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.verify2FA({ code });

          // 토큰 저장
          tokenStorage.setTokens(response.access_token, response.refresh_token);

          // 사용자 정보 설정
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          toast.success('2FA 인증이 완료되었습니다.');
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '2FA 인증에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      // ============================================================================
      // 상태 관리
      // ============================================================================

      // 인증 상태 확인 (이름 통일)
      checkAuthStatus: async (): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          const token = tokenStorage.getAccessToken();
          if (!token) {
            set({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
            return;
          }

          // 토큰 유효성 검사 및 사용자 정보 가져오기
          try {
            const user = await authService.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } catch (error) {
            // 토큰이 만료된 경우 갱신 시도
            const refreshSuccess = await get().refreshToken();
            if (!refreshSuccess) {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
              });
            }
          }
        } catch (error) {
          console.error('Auth status check failed:', error);
          set({
            isAuthenticated: false,
            isLoading: false,
            error: null,
            user: null
          });
        }
      },

      // 현재 사용자 정보 조회
      getCurrentUser: async (): Promise<User> => {
        try {
          const user = await authService.getCurrentUser();
          set({ user });
          return user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '사용자 정보 조회에 실패했습니다.';
          set({ error: errorMessage });
          throw error;
        }
      },

      // 에러 초기화
      clearError: () => set({ error: null }),

      // 상태 초기화
      reset: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }),
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

// ============================================================================
// 메인 인증 훅
// ============================================================================

export const useAuth = () => {
  const store = useAuthStore();

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    store.checkAuthStatus();
  }, [store]);

  // 토큰 자동 갱신 설정
  useEffect(() => {
    if (!store.isAuthenticated) return;

    const checkAndRefreshToken = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) return;

      // 토큰 만료 시간 확인 (JWT 디코딩)
      try {
        const base64Payload = token.split('.')[1] ?? '';
        const payload = JSON.parse(atob(base64Payload));
        const currentTime = Date.now() / 1000;

        // 토큰이 5분 내에 만료되면 갱신
        if (payload.exp - currentTime < 300) {
          await store.refreshToken();
        }
      } catch (error) {
        console.error('Token decode error:', error);
      }
    };

    // 5분마다 토큰 체크
    const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [store.isAuthenticated, store]);

  return store;
};

// ============================================================================
// 개별 선택자 훅들 (성능 최적화용)
// ============================================================================

export const useAuthUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthError = () => useAuthStore(state => state.error);

// ============================================================================
// 편의 훅들
// ============================================================================

// 권한 체크 훅
export const useIsLoggedIn = () => {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && !!user;
};

// 특정 역할 체크 훅
export const useHasRole = (role: string) => {
  const { user } = useAuth();
  return user?.role === role;
};

// 다중 역할 체크 훅
export const useHasAnyRole = (roles: string[]) => {
  const { user } = useAuth();
  return user?.role ? roles.includes(user.role) : false;
};

// 로딩 상태 체크
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, error } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    error,
    isInitialized: !isLoading,
    hasError: !!error,
  };
};
