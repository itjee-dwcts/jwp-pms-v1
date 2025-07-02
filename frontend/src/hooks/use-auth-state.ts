import { authService } from '@/services/auth-service';
import type {
    AuthActions,
    AuthResponse,
    AuthState,
    LoginCredentials,
    PasswordChangeRequest,
    PasswordResetRequest,
    RegisterCredentials,
    User,
} from '@/types/auth';
import { useCallback, useState } from 'react';

export const useAuthState = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setUser = useCallback((user: User | null) => {
    updateState({
      user,
      isAuthenticated: !!user,
      error: null,
    });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const user = await authService.checkAuthStatus();
      setUser(user);
      setLoading(false);
      return !!user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication check failed';
      setError(errorMessage);
      setUser(null);
      setLoading(false);
      return false;
    }
  }, [setUser, setError, setLoading]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      setUser(response.user);
      setLoading(false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [setUser, setError, setLoading]);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(credentials);
      setUser(response.user);
      setLoading(false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [setUser, setError, setLoading]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, [setUser]);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<User> => {
    try {
      setError(null);
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      throw error;
    }
  }, [setUser, setError]);

  const changePassword = useCallback(async (data: PasswordChangeRequest): Promise<void> => {
    try {
      setError(null);
      await authService.changePassword(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      setError(errorMessage);
      throw error;
    }
  }, [setError]);

  const resetPassword = useCallback(async (data: PasswordResetRequest): Promise<void> => {
    try {
      setError(null);
      await authService.resetPassword(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setError(errorMessage);
      throw error;
    }
  }, [setError]);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      setError(null);
      await authService.forgotPassword(email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
      setError(errorMessage);
      throw error;
    }
  }, [setError]);

  const refreshToken = useCallback(async (): Promise<string> => {
    try {
      return await authService.refreshToken();
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, [setUser]);

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    resetPassword,
    forgotPassword,
    refreshToken,
    checkAuth,
    clearError,
  };
};
