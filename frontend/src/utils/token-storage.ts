import { config } from '@/lib/config';

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(config.TOKEN_STORAGE_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(config.REFRESH_TOKEN_STORAGE_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(config.TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(config.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(config.TOKEN_STORAGE_KEY);
    localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
  },

  hasValidToken: (): boolean => {
    const token = localStorage.getItem(config.TOKEN_STORAGE_KEY);
    return !!token;
  },
};
