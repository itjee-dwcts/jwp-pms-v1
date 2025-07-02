import type {
    AuthResponse,
    LoginCredentials,
    PasswordChangeRequest,
    PasswordResetRequest,
    RegisterCredentials,
    User,
} from '@/types/auth';
import { apiClient } from './api-client';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    apiClient.setTokens(response.access_token, response.refresh_token);
    return response;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    apiClient.setTokens(response.access_token, response.refresh_token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.request<User>('/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: PasswordChangeRequest): Promise<void> {
    await apiClient.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: PasswordResetRequest): Promise<void> {
    await apiClient.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async refreshToken(): Promise<string> {
    return apiClient.refreshAccessToken();
  }

  async checkAuthStatus(): Promise<User | null> {
    if (!apiClient.accessToken) {
      return null;
    }

    try {
      return await this.getCurrentUser();
    } catch (error) {
      console.error('Auth check failed:', error);
      apiClient.clearTokens();
      return null;
    }
  }
}

// Singleton instance
export const authService = new AuthService();
