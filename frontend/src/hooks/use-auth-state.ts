import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { authService } from '../services/auth-service';
import type {
  AuthActions,
  AuthState,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  TwoFactorSetupResponse,
  UpdateProfileRequest,
  User
} from '../types/auth';
import { tokenStorage } from '../utils/token-storage';

/**
 * 인증 상태 관리 훅
 * - 인증 상태와 관련 액션들을 제공
 * - 토큰 관리 및 자동 갱신
 * - 에러 처리 및 사용자 피드백
 */
export const useAuthState = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * 상태 업데이트 헬퍼 함수
   */
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 사용자 설정
   */
  const setUser = useCallback((user: User | null) => {
    updateState({
      user,
      isAuthenticated: !!user,
      error: null,
    });
  }, [updateState]);

  /**
   * 에러 설정
   */
  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  /**
   * 로딩 상태 설정
   */
  const setLoading = useCallback((isLoading: boolean) => {
    updateState({ isLoading });
  }, [updateState]);

  /**
   * 인증 상태 설정
   */
  const setAuthenticated = useCallback((isAuthenticated: boolean) => {
    updateState({ isAuthenticated });
  }, [updateState]);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * 인증 상태 확인
   */
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const user = await authService.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
      tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setError, setLoading]);

  /**
   * 현재 사용자 정보 조회
   */
  const getCurrentUser = useCallback(async (): Promise<User> => {
    try {
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '사용자 정보 조회에 실패했습니다.';
      setError(errorMessage);
      throw error;
    }
  }, [setUser, setError]);

  /**
   * 로그인
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);

      // 토큰 저장
      tokenStorage.setTokens(response.access_token, response.refresh_token);

      setUser(response.user);
      setLoading(false);

      toast.success('로그인되었습니다.');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setUser, setError, setLoading]);

  /**
   * 회원가입
   */
  const register = useCallback(async (credentials: RegisterRequest): Promise<RegisterResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(credentials);

      // 토큰이 있으면 저장 (자동 로그인 처리)
      if (response.access_token && response.refresh_token) {
        tokenStorage.setTokens(response.access_token, response.refresh_token);
        setUser(response.user);
      }

      setLoading(false);
      toast.success('회원가입이 완료되었습니다.');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setUser, setError, setLoading]);

  /**
   * 로그아웃
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      setLoading(false);
      toast.success('로그아웃되었습니다.');
    }
  }, [setUser, setLoading]);

  /**
   * 프로필 업데이트
   */
  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<User> => {
    try {
      setLoading(true);
      setError(null);

      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      setLoading(false);

      toast.success('프로필이 업데이트되었습니다.');
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setUser, setError, setLoading]);

  /**
   * 비밀번호 변경
   */
  const changePassword = useCallback(async (data: ChangePasswordRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await authService.changePassword(data);
      setLoading(false);

      toast.success('비밀번호가 변경되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setError, setLoading]);

  /**
   * 비밀번호 재설정
   */
  const resetPassword = useCallback(async (data: ResetPasswordRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await authService.resetPassword(data);
      setLoading(false);

      toast.success('비밀번호가 재설정되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '비밀번호 재설정에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setError, setLoading]);

  /**
   * 비밀번호 재설정 요청
   */
  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // requestPasswordReset 메서드 사용 (호환성)
      await authService.requestPasswordReset(email);
      setLoading(false);

      toast.success('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '비밀번호 재설정 요청에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setError, setLoading]);

  /**
   * 토큰 갱신
   */
  const refreshToken = useCallback(async (token?: string): Promise<void> => {
    try {
      const refreshTokenValue = token || tokenStorage.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('리프레시 토큰이 없습니다.');
      }

      const response = await authService.refreshToken(refreshTokenValue);

      // 새 토큰 저장
      tokenStorage.setTokens(response.access_token, response.refresh_token);

      // 사용자 정보 업데이트 (필요한 경우)
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      tokenStorage.clearTokens();
      setUser(null);
      throw error;
    }
  }, [setUser]);

  /**
   * 이메일 인증
   */
  const verifyEmail = useCallback(async (token: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await authService.verifyEmail(token);

      // 현재 사용자 정보 새로고침
      const user = await getCurrentUser();
      setUser(user);
      setLoading(false);

      toast.success('이메일이 인증되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이메일 인증에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [getCurrentUser, setUser, setError, setLoading]);

  /**
   * 이메일 인증 재전송
   */
  const resendVerificationEmail = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await authService.resendVerificationEmail();
      setLoading(false);

      toast.success('인증 이메일이 재전송되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이메일 재전송에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setError, setLoading]);

  /**
   * OAuth URL 생성
   */
  const getOAuthUrl = useCallback((provider: string): string => {
    return authService.getOAuthUrl(provider as 'google' | 'github' | 'microsoft');
  }, []);

  /**
   * OAuth 콜백 처리
   */
  const handleOAuthCallback = useCallback(async (
    provider: string,
    code: string,
    state?: string
  ): Promise<LoginResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.handleOAuthCallback(provider, code, state);

      // 토큰 저장
      tokenStorage.setTokens(response.access_token, response.refresh_token);

      setUser(response.user);
      setLoading(false);

      toast.success('OAuth 로그인이 완료되었습니다.');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth 로그인에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setUser, setError, setLoading]);

  /**
   * 2단계 인증 활성화
   */
  const enable2FA = useCallback(async (): Promise<TwoFactorSetupResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.enable2FA();
      setLoading(false);

      toast.success('2단계 인증이 설정되었습니다.');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2단계 인증 설정에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setError, setLoading]);

  /**
   * 2단계 인증 비활성화
   */
  const disable2FA = useCallback(async (code: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await authService.disable2FA(code);
      setLoading(false);

      toast.success('2단계 인증이 비활성화되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2단계 인증 비활성화에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setError, setLoading]);

  /**
   * 2단계 인증 검증
   */
  const verify2FA = useCallback(async (code: string): Promise<LoginResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.verify2FA({ code });

      // 토큰 저장
      tokenStorage.setTokens(response.access_token, response.refresh_token);

      setUser(response.user);
      setLoading(false);

      toast.success('2단계 인증이 완료되었습니다.');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2단계 인증에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  }, [setUser, setError, setLoading]);

  return {
    ...state,

    // 기본 인증
    login,
    register,
    logout,
    refreshToken,

    // 사용자 관리
    updateProfile,
    changePassword,

    // 비밀번호 재설정
    forgotPassword,
    resetPassword,

    // 이메일 인증
    verifyEmail,
    resendVerificationEmail,

    // OAuth
    getOAuthUrl,
    handleOAuthCallback,

    // 2단계 인증
    enable2FA,
    disable2FA,
    verify2FA,

    // 상태 관리
    checkAuthStatus,
    getCurrentUser,
    clearError,
    reset,

    // 내부 상태 설정
    setUser,
    setLoading,
    setError,
    setAuthenticated,
  };
};
