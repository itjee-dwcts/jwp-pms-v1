import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/auth';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest
} from '../types/auth';
import { authService } from '../services/auth-service';
import { tokenStorage } from '../utils/token-storage'; // tokenStorage 임포트 수정

// ============================================================================
// 개선된 인증 서비스 (tokenStorage 활용)
// ============================================================================
const enhancedAuthService = {
  // 로그인 - tokenStorage 활용
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('🔑 로그인 시도:', credentials.username);

    try {
      // Mock 테스트 계정 처리
      if (credentials.username === 'test' || credentials.username === 'testuser') {
        await new Promise(resolve => setTimeout(resolve, 800));

        if (credentials.password.length >= 6) {
          const mockUser: User = {
            id: '1',
            username: credentials.username,
            email: 'test@example.com',
            full_name: '테스트 사용자',
            role: 'user',
            avatar_url: '',
            is_verified: true,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'active',
            is_active: true
          };

          // JWT 형태의 mock 토큰 생성 (tokenStorage에서 파싱 가능)
          const mockAccessToken = enhancedAuthService.createMockJWT(mockUser, 3600); // 1시간
          const mockRefreshToken = enhancedAuthService.createMockJWT(mockUser, 86400); // 24시간

          return {
            access_token: mockAccessToken,
            refresh_token: mockRefreshToken,
            token_type: 'Bearer',
            user: mockUser,
            expires_in: 3600
          };
        }
        throw new Error('사용자명 또는 비밀번호가 올바르지 않습니다');
      }

      // 실제 서비스 호출
      return await authService.login(credentials);
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  },

  // Mock JWT 토큰 생성 (개발용)
  createMockJWT: (user: User, expiresInSeconds: number): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      iat: Math.floor(Date.now() / 1000)
    }));
    const signature = btoa('mock_signature');
    return `${header}.${payload}.${signature}`;
  },

  // 토큰 갱신 - tokenStorage 활용
  refreshToken: async (): Promise<{ access_token: string; refresh_token: string }> => {
    console.log('🔄 토큰 갱신 시작');

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다');
    }

    // 토큰 유효성 검사
    if (!tokenStorage.isTokenValid(refreshToken)) {
      throw new Error('리프레시 토큰이 만료되었습니다');
    }

    try {
      // Mock 환경에서는 새 토큰 생성
      const userInfo = tokenStorage.getUserFromToken(refreshToken);
      if (userInfo) {
        const newAccessToken = enhancedAuthService.createMockJWT(userInfo, 3600);
        const newRefreshToken = enhancedAuthService.createMockJWT(userInfo, 86400);

        return {
          access_token: newAccessToken,
          refresh_token: newRefreshToken
        };
      }

      // 실제 환경에서는 서비스 호출
      const response = await authService.refreshToken(refreshToken);
      return {
        access_token: response.access_token,
        refresh_token: response.refresh_token ?? refreshToken // 기존 refreshToken을 fallback으로 사용
      };
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      throw error;
    }
  },

  // 현재 사용자 정보 조회 - tokenStorage 활용
  getCurrentUser: async (): Promise<User> => {
    console.log('👤 사용자 정보 조회');

    const token = tokenStorage.getAccessToken();
    if (!token) {
      throw new Error('인증 토큰이 없습니다');
    }

    // 토큰 유효성 검사
    if (!tokenStorage.isTokenValid(token)) {
      throw new Error('토큰이 만료되었습니다');
    }

    // 토큰에서 사용자 정보 추출
    const userFromToken = tokenStorage.getUserFromToken(token);
    if (userFromToken) {
      return {
        id: userFromToken.user_id || userFromToken.sub,
        username: userFromToken.username,
        email: userFromToken.email,
        full_name: userFromToken.full_name || userFromToken.name || '',
        role: userFromToken.role || 'user',
        avatar_url: userFromToken.avatar_url || '',
        is_verified: userFromToken.is_verified || true,
        last_login: userFromToken.last_login || new Date().toISOString(),
        created_at: userFromToken.created_at || new Date().toISOString(),
        updated_at: userFromToken.updated_at || new Date().toISOString(),
        status: userFromToken.status || 'active',
        is_active: userFromToken.is_active !== false
      };
    }

    // 실제 API 호출
    return await authService.getCurrentUser();
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    console.log('🚪 로그아웃 처리');

    try {
      // 서버에 로그아웃 요청 (선택사항)
      await authService.logout?.();
    } catch (error) {
      console.warn('서버 로그아웃 요청 실패:', error);
    }

    // 로컬 토큰 정리
    tokenStorage.clearTokens();
  }
};

// ============================================================================
// Zustand Store 정의 (기존과 동일)
// ============================================================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (userData: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  getCurrentUser: () => Promise<User>;
  refreshTokens: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

// ============================================================================
// Zustand Store 생성 (tokenStorage 통합)
// ============================================================================
const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 상태 설정 메서드
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      // 로그인 - tokenStorage 완전 통합
      login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login(credentials);

          // tokenStorage에 토큰 저장
          const success = tokenStorage.setTokens(
            response.access_token,
            response.refresh_token,
            { rememberMe: true }
          );

          if (!success) {
            throw new Error('토큰 저장에 실패했습니다');
          }

          // 토큰 상태 디버그 (개발 환경)
          if (process.env.NODE_ENV === 'development') {
            tokenStorage.debugTokens();
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          console.log('✅ 로그인 성공:', response.user.username);
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
          const response = await authService.register(userData);
          set({ isLoading: false, error: null });
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 로그아웃 - tokenStorage 활용
      logout: async (): Promise<void> => {
        try {
          set({ isLoading: true });
          await enhancedAuthService.logout();
        } catch (error) {
          console.error('로그아웃 오류:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          console.log('✅ 로그아웃 완료');
        }
      },

      // 토큰 갱신
      refreshTokens: async (): Promise<void> => {
        try {
          console.log('🔄 토큰 갱신 시도');

          const { access_token, refresh_token } = await enhancedAuthService.refreshToken();

          // 새 토큰 저장
          tokenStorage.setTokens(access_token, refresh_token);

          // 사용자 정보 업데이트
          const user = await enhancedAuthService.getCurrentUser();
          set({ user, isAuthenticated: true, error: null });

          console.log('✅ 토큰 갱신 성공');
        } catch (error) {
          console.error('❌ 토큰 갱신 실패:', error);

          // 갱신 실패 시 로그아웃 처리
          tokenStorage.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            error: '세션이 만료되었습니다. 다시 로그인해주세요.'
          });
          throw error;
        }
      },

      // 인증 상태 확인 - tokenStorage 완전 활용
      checkAuthStatus: async (): Promise<void> => {
        try {
          console.log('🔍 인증 상태 확인 시작');
          set({ isLoading: true, error: null });

          // tokenStorage에서 토큰 상태 확인
          const tokenStatus = tokenStorage.getTokenStatus();

          if (!tokenStatus.hasToken) {
            console.log('❌ 토큰 없음');
            set({ isAuthenticated: false, isLoading: false, user: null });
            return;
          }

          // 토큰이 만료되었으면 갱신 시도
          if (tokenStatus.shouldRefresh) {
            console.log('🔄 토큰 갱신 필요');
            await get().refreshTokens();
            return;
          }

          // 토큰이 유효하면 사용자 정보 설정
          if (tokenStatus.isValid && tokenStatus.user) {
            console.log('✅ 유효한 토큰, 사용자 정보 설정');
            set({
              user: {
                id: tokenStatus.user.user_id || tokenStatus.user.sub,
                username: tokenStatus.user.username,
                email: tokenStatus.user.email,
                full_name: tokenStatus.user.full_name || tokenStatus.user.name || '',
                role: tokenStatus.user.role || 'user',
                avatar_url: tokenStatus.user.avatar_url || '',
                is_verified: tokenStatus.user.is_verified || true,
                last_login: tokenStatus.user.last_login || new Date().toISOString(),
                created_at: tokenStatus.user.created_at || new Date().toISOString(),
                updated_at: tokenStatus.user.updated_at || new Date().toISOString(),
                status: tokenStatus.user.status || 'active',
                is_active: tokenStatus.user.is_active !== false
              },
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            // 토큰이 있지만 유효하지 않음
            console.log('❌ 무효한 토큰');
            tokenStorage.clearTokens();
            set({ isAuthenticated: false, isLoading: false, user: null });
          }

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

      // 현재 사용자 정보 조회
      getCurrentUser: async (): Promise<User> => {
        try {
          const user = await enhancedAuthService.getCurrentUser();
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
          set({ user: updatedUser, isLoading: false, error: null });
          return updatedUser;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 비밀번호 재설정
      resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
        try {
          set({ isLoading: true, error: null });
          await authService.resetPassword(data);
          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '비밀번호 재설정에 실패했습니다.';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 비밀번호 변경
      changePassword: async (data: ChangePasswordRequest): Promise<void> => {
        try {
          set({ isLoading: true, error: null });
          await authService.changePassword(data);
          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 에러 초기화
      clearError: () => set({ error: null }),

      // 상태 초기화
      reset: () => {
        tokenStorage.clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // tokenStorage가 토큰을 관리하므로 여기서는 사용자 정보만 저장
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================================================
// 메인 인증 훅 (tokenStorage 자동 정리 포함)
// ============================================================================
export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (store.isAuthenticated || store.isLoading) {
        console.log('⏭️ 인증 상태 확인 스킵');
        return;
      }

      console.log('🚀 인증 상태 초기화 시작');

      // 만료된 토큰 정리
      tokenStorage.cleanupExpiredTokens();

      // 토큰이 있을 때만 상태 확인
      if (tokenStorage.hasTokens() && mounted) {
        await store.checkAuthStatus();
      } else {
        console.log('📋 토큰 없음');
        store.setLoading(false);
      }
    };

    initAuth();

    // 주기적으로 토큰 상태 확인 (5분마다)
    const interval = setInterval(() => {
      if (mounted && store.isAuthenticated) {
        const tokenStatus = tokenStorage.getTokenStatus();
        if (tokenStatus.shouldRefresh) {
          console.log('⏰ 주기적 토큰 갱신');
          store.refreshTokens().catch(console.error);
        }
      }
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return store;
};

// ============================================================================
// 개별 선택자 훅들 (기존과 동일)
// ============================================================================
export const useAuthUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthError = () => useAuthStore(state => state.error);

// ============================================================================
// 편의 훅들 (기존과 동일)
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

// ============================================================================
// 토큰 관리 훅 (새로 추가)
// ============================================================================
export const useTokenStatus = () => {
  const [tokenStatus, setTokenStatus] = useState(tokenStorage.getTokenStatus());

  useEffect(() => {
    const updateStatus = () => {
      setTokenStatus(tokenStorage.getTokenStatus());
    };

    const interval = setInterval(updateStatus, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  return tokenStatus;
};
