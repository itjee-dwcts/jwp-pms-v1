import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/auth'; // 임시 타입 정의 위치
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ResetPasswordRequest, ChangePasswordRequest, UpdateProfileRequest } from '../types/auth';
import { authService } from '../services/auth-service'; // 실제 서비스는 authService로 변경 필요

// ============================================================================
// 임시 토큰 스토리지 (tokenStorage 대체)
// ============================================================================
const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// ============================================================================
// 임시 인증 서비스 (authService 대체)
// ============================================================================
const mockAuthService = {
  // 로그인 (테스트용 mock 구현)
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('🔑 Mock 로그인 시도:', credentials);

    // 간단한 시뮬레이션 지연
    await new Promise(resolve => setTimeout(resolve, 800));

    // 테스트 계정 검증
    if (credentials.username === 'test' || credentials.username === 'testuser') {
      if (credentials.password.length >= 6) {
        const mockUser: User = {
          id: '1',
          username: credentials.username,
          email: 'test@example.com',
          full_name: '테스트',
          role: 'user',
          avatar_url: '',
          is_verified: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active', // 추가
          is_active: true   // 추가
        };

        return {
          access_token: 'mock_access_token_' + Date.now(),
          refresh_token: 'mock_refresh_token_' + Date.now(),
          token_type: 'Bearer',
          user: mockUser,
          expires_in: 3600
        };
      }
    }

    throw new Error('사용자명 또는 비밀번호가 올바르지 않습니다');
  },

  // 회원가입
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    console.log('📝 Mock 회원가입:', userData);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: userData.username,
      email: userData.email,
      role: 'user',
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active', // 추가
      is_active: true,  // 추가
      full_name: userData.full_name ?? '' // 항상 full_name을 포함
    };

    return {
      user: mockUser,
      message: '회원가입이 완료되었습니다.'
    };
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    console.log('🚪 Mock 로그아웃');
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async (): Promise<User> => {
    console.log('👤 Mock 사용자 정보 조회');
    const token = tokenStorage.getAccessToken();

    if (!token) {
      throw new Error('인증 토큰이 없습니다');
    }

    // Mock 사용자 반환
    return {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      full_name: '테스트',
      role: 'user',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active', // 추가
      is_active: true   // 추가
    };
  },

  // 토큰 갱신
  refreshToken: async (_refreshToken: string): Promise<{ access_token: string; refresh_token: string }> => {
    console.log('🔄 Mock 토큰 갱신');
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      access_token: 'mock_access_token_refreshed_' + Date.now(),
      refresh_token: 'mock_refresh_token_refreshed_' + Date.now()
    };
  }
};

// ============================================================================
// Zustand Store 정의
// ============================================================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // 상태 설정
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;

  // 인증 액션
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (userData: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => Promise<void>;

  // 사용자 관리
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;

  // 상태 관리
  checkAuthStatus: () => Promise<void>;
  getCurrentUser: () => Promise<User>;
  clearError: () => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

// ============================================================================
// Zustand Store 생성
// ============================================================================
const useAuthStore = create<AuthStore>()(
  persist(
    (set, _get) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,
      isLoading: false, // 초기 로딩을 false로 변경 - 중요!
      error: null,

      // 상태 설정 메서드
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      // 로그인
      login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        try {
          set({ isLoading: true, error: null });

          let response: LoginResponse;

          if (credentials.username === "test") {
            console.log('🔧 Mock 서비스 사용 - test 로그인');
            response = await mockAuthService.login(credentials);
          } else {
            console.log('🌐 실제 서비스 사용 - 일반 로그인');
            response = await authService.login(credentials);
          }

          // 토큰 저장
          tokenStorage.setTokens(response.access_token, response.refresh_token);

          // 상태 업데이트
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

      // 회원가입
      register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
        try {
          set({ isLoading: true, error: null });

          //const response = await mockAuthService.register(userData);
          const response = await authService.register(userData);

          set({ isLoading: false, error: null });
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다';
          set({
            error: errorMessage,
            isLoading: false
          });
          throw error;
        }
      },

      // 로그아웃
      logout: async (): Promise<void> => {
        try {
          set({ isLoading: true });

          await mockAuthService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          tokenStorage.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      // 인증 상태 확인 (간소화)
      checkAuthStatus: async (): Promise<void> => {
        try {
          console.log('🔍 인증 상태 확인 시작');
          set({ isLoading: true, error: null });

          const token = tokenStorage.getAccessToken();

          if (!token) {
            console.log('❌ 토큰 없음 - 미인증 상태');
            set({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
            return;
          }

          // 토큰이 있으면 사용자 정보 조회
          const user = await mockAuthService.getCurrentUser();
          console.log('✅ 사용자 정보 조회 성공:', user.username);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

        } catch (error) {
          console.error('❌ 인증 상태 확인 실패:', error);
          tokenStorage.clearTokens();
          set({
            isAuthenticated: false,
            isLoading: false,
            error: null,
            user: null
          });
        }
      },

       // ============================================================================
      // 사용자 관리
      // ============================================================================

      // 현재 사용자 정보 조회
      getCurrentUser: async (): Promise<User> => {
        try {
          const user = await mockAuthService.getCurrentUser();
          set({ user });
          return user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '사용자 정보 조회에 실패했습니다';
          set({ error: errorMessage });
          throw error;
        }
      },

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

          //toast.success('프로필이 업데이트되었습니다.');
          return updatedUser;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          //toast.error(errorMessage);
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

          // toast.success('비밀번호가 재설정되었습니다.');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '비밀번호 재설정에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          // toast.error(errorMessage);
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

          //toast.success('비밀번호가 변경되었습니다.');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.';
          set({
            error: errorMessage,
            isLoading: false
          });
          //toast.error(errorMessage);
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

  // 최초 1회만 인증 상태 확인 (조건부 실행)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // 이미 인증되어 있거나 로딩 중이면 스킵
      if (store.isAuthenticated || store.isLoading) {
        console.log('⏭️ 인증 상태 확인 스킵 - 이미 처리됨');
        return;
      }

      console.log('🚀 인증 상태 초기화 시작');

      // 토큰이 있을 때만 상태 확인
      const token = tokenStorage.getAccessToken();
      if (token && mounted) {
        await store.checkAuthStatus();
      } else {
        console.log('📋 토큰 없음 - 인증 상태 false로 설정');
        store.setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []); // 빈 의존성 배열로 최초 1회만 실행

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
export const useIsLoggedIn = () => {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && !!user;
};

export const useHasRole = (role: string) => {
  const { user } = useAuth();
  return user?.role === role;
};

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
