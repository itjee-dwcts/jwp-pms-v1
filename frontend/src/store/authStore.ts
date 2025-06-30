import { apiClient, authApi } from '@/lib/api';
import { APP_CONSTANTS } from '@/lib/config';
import { AuthState, LoginRequest, RegisterRequest, User } from '@/types';
import { toast } from 'react-hot-toast';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authApi.login(credentials);

          if (response.success) {
            const { user, accessToken, refreshToken } = response.data;

            // Store tokens
            apiClient.setTokens(accessToken, refreshToken);

            // Update state
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            toast.success(`Welcome back, ${user.firstName}!`);
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
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

      register: async (userData: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });

          // Validate passwords match
          if (userData.password !== userData.confirmPassword) {
            throw new Error('Passwords do not match');
          }

          const response = await authApi.register(userData);

          if (response.success) {
            set({ isLoading: false, error: null });
            toast.success('Registration successful! Please log in.');
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          // Call logout endpoint (optional, for session cleanup)
          try {
            await authApi.logout();
          } catch {
            // Ignore logout API errors, proceed with local cleanup
          }

          // Clear tokens and state
          apiClient.clearAuth();
          apiClient.clearCache(); // Clear any cached data

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });

          toast.success('Logged out successfully');
        } catch (error: any) {
          set({ isLoading: false });
          console.error('Logout error:', error);
        }
      },

      forgotPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authApi.forgotPassword(email);

          if (response.success) {
            set({ isLoading: false, error: null });
            toast.success('Password reset instructions sent to your email');
          } else {
            throw new Error(response.message || 'Failed to send reset email');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset email';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      resetPassword: async (token: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authApi.resetPassword(token, password);

          if (response.success) {
            set({ isLoading: false, error: null });
            toast.success('Password reset successful! Please log in with your new password.');
          } else {
            throw new Error(response.message || 'Password reset failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Password reset failed';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authApi.changePassword(currentPassword, newPassword);

          if (response.success) {
            set({ isLoading: false, error: null });
            toast.success('Password changed successfully');
          } else {
            throw new Error(response.message || 'Password change failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authApi.updateProfile(data);

          if (response.success) {
            const updatedUser = response.data;

            set({
              user: updatedUser,
              isLoading: false,
              error: null
            });

            toast.success('Profile updated successfully');
          } else {
            throw new Error(response.message || 'Profile update failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      checkAuthStatus: async () => {
        try {
          const token = localStorage.getItem(APP_CONSTANTS.TOKEN_STORAGE_KEY);

          if (!token) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            return;
          }

          set({ isLoading: true });

          // Verify token and get current user
          const response = await authApi.getProfile();

          if (response.success) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            throw new Error('Invalid token');
          }
        } catch (error: any) {
          // Token is invalid, clear auth data
          apiClient.clearAuth();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Only persist essential auth state
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for easier state access
export const useUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthError = () => useAuthStore(state => state.error);

// Helper functions
export const hasRole = (user: User | null, role: string): boolean => {
  if (!user) return false;
  return user.roles.some(r => r.name === role);
};

export const hasPermission = (user: User | null, resource: string, action: string): boolean => {
  if (!user) return false;

  return user.roles.some(role =>
    role.permissions.some(permission =>
      permission.resource === resource && permission.action === action
    )
  );
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin') || hasRole(user, 'Admin');
};

export const isProjectManager = (user: User | null): boolean => {
  return hasRole(user, 'project_manager') || hasRole(user, 'Project Manager');
};

export const isDeveloper = (user: User | null): boolean => {
  return hasRole(user, 'developer') || hasRole(user, 'Developer');
};

export const canCreateProject = (user: User | null): boolean => {
  return hasPermission(user, 'project', 'create') || isAdmin(user) || isProjectManager(user);
};

export const canEditProject = (user: User | null, projectOwnerId?: string): boolean => {
  if (isAdmin(user)) return true;
  if (hasPermission(user, 'project', 'update')) return true;
  if (user && projectOwnerId && user.id === projectOwnerId) return true;
  return false;
};

export const canDeleteProject = (user: User | null, projectOwnerId?: string): boolean => {
  if (isAdmin(user)) return true;
  if (hasPermission(user, 'project', 'delete')) return true;
  if (user && projectOwnerId && user.id === projectOwnerId) return true;
  return false;
};

export const canManageUsers = (user: User | null): boolean => {
  return hasPermission(user, 'user', 'manage') || isAdmin(user);
};

// Auth guards for components
export const useAuthGuard = (requiredRole?: string, requiredPermission?: { resource: string; action: string }) => {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return { hasAccess: false, reason: 'not_authenticated' };
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    return { hasAccess: false, reason: 'insufficient_role' };
  }

  if (requiredPermission && !hasPermission(user, requiredPermission.resource, requiredPermission.action)) {
    return { hasAccess: false, reason: 'insufficient_permission' };
  }

  return { hasAccess: true };
};
