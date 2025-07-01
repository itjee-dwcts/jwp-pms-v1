import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { config } from '@/lib/config';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

interface PasswordResetRequest {
  token: string;
  email: string;
  new_password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  changePassword: (data: PasswordChangeRequest) => Promise<void>;
  resetPassword: (data: PasswordResetRequest) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshToken: () => Promise<string>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
const getStoredToken = (): string | null => {
  return localStorage.getItem(config.TOKEN_STORAGE_KEY);
};

const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(config.REFRESH_TOKEN_STORAGE_KEY);
};

const setStoredTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(config.TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(config.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
};

const clearStoredTokens = (): void => {
  localStorage.removeItem(config.TOKEN_STORAGE_KEY);
  localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
};

// API client with automatic token refresh
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.accessToken = getStoredToken();
    this.refreshToken = getStoredRefreshToken();
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    setStoredTokens(accessToken, refreshToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    clearStoredTokens();
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      this.clearTokens();
      throw error;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token is available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401 && this.refreshToken && !this.isRefreshing) {
      try {
        await this.refreshAccessToken();
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (refreshError) {
        // Refresh failed, clear tokens and throw error
        this.clearTokens();
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

const apiClient = new ApiClient(config.API_BASE_URL);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const checkAuth = useCallback(async (): Promise<boolean> => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return false;
    }

    try {
      const userData = await apiClient.request<User>('/auth/me');
      setUser(userData);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      clearStoredTokens();
      setUser(null);
      setLoading(false);
      return false;
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      apiClient.setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      apiClient.setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearTokens();
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<User> => {
    try {
      const updatedUser = await apiClient.request<User>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (data: PasswordChangeRequest): Promise<void> => {
    try {
      await apiClient.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (data: PasswordResetRequest): Promise<void> => {
    try {
      await apiClient.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      await apiClient.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      throw error;
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<string> => {
    try {
      return await apiClient.refreshAccessToken();
    } catch (error) {
      throw error;
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
        logout();
      }
    }, config.TOKEN_REFRESH_THRESHOLD);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken, logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    resetPassword,
    forgotPassword,
    refreshToken,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the API client for use in other hooks
export { apiClient };

export default useAuth;
