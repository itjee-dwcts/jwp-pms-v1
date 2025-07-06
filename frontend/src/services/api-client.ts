import { config } from '../lib/config';
import { tokenStorage } from '../utils/token-storage';

export class ApiClient {
  public baseUrl: string;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseUrl: string = config.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  get accessToken(): string | null {
    return tokenStorage.getAccessToken();
  }

  get refreshToken(): string | null {
    return tokenStorage.getRefreshToken();
  }

  setTokens(accessToken: string, refreshToken: string): void {
    tokenStorage.setTokens(accessToken, refreshToken);
  }

  clearTokens(): void {
    tokenStorage.clearTokens();
  }

  async refreshAccessToken(): Promise<string> {
    // Prevent multiple refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } catch (error) {
      this.clearTokens();
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
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
    let response = await this.makeRequest(url, options);

    // Handle token expiration and retry once
    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        response = await this.makeRequest(url, options);
      } catch (refreshError) {
        this.clearTokens();
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ||
        errorData?.detail ||
        `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    return fetch(url, { ...options, headers });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
