/**
 * 토큰 저장소 유틸리티
 * 액세스 토큰과 리프레시 토큰을 안전하게 관리합니다.
 */

const ACCESS_TOKEN_KEY = 'pms_access_token';
const REFRESH_TOKEN_KEY = 'pms_refresh_token';

export class TokenStorage {
  /**
   * 액세스 토큰 저장
   */
  setAccessToken(token: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save access token:', error);
    }
  }

  /**
   * 리프레시 토큰 저장
   */
  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save refresh token:', error);
    }
  }

  /**
   * 토큰들 동시 저장
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    this.setAccessToken(accessToken);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }

  /**
   * 액세스 토큰 조회
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * 리프레시 토큰 조회
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * 토큰 존재 여부 확인
   */
  hasTokens(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * 토큰 유효성 확인 (간단한 검사)
   */
  isTokenValid(token?: string): boolean {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) return false;

    try {
      // JWT 토큰 디코딩 및 만료 시간 확인
      const base64Payload = tokenToCheck.split('.')[1];
      if (!base64Payload) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(atob(base64Payload));
      const currentTime = Date.now() / 1000;

      return payload.exp > currentTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * 토큰 만료 시간 조회 (초 단위)
   */
  getTokenExpiration(token?: string): number | null {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) return null;

    try {
      const base64Payload = tokenToCheck.split('.')[1];
      if (!base64Payload) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(atob(base64Payload));
      return payload.exp;
    } catch (error) {
      console.error('Token expiration parsing error:', error);
      return null;
    }
  }

  /**
   * 토큰 만료까지 남은 시간 (초 단위)
   */
  getTimeUntilExpiration(token?: string): number | null {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return null;

    const currentTime = Date.now() / 1000;
    return Math.max(0, expiration - currentTime);
  }

  /**
   * 토큰이 곧 만료되는지 확인 (기본: 5분)
   */
  isTokenExpiringSoon(token?: string, thresholdSeconds: number = 300): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration(token);
    if (timeUntilExpiration === null) return true;

    return timeUntilExpiration < thresholdSeconds;
  }

  /**
   * 모든 토큰 삭제
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * 토큰에서 사용자 정보 추출
   */
  getUserFromToken(token?: string): any | null {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) return null;

    try {
      const base64Payload = tokenToCheck.split('.')[1];
      if (!base64Payload) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(atob(base64Payload));
      return {
        id: payload.sub || payload.user_id,
        email: payload.email,
        role: payload.role,
        name: payload.name,
        ...payload
      };
    } catch (error) {
      console.error('User extraction error:', error);
      return null;
    }
  }

  /**
   * 토큰 갱신이 필요한지 확인
   */
  shouldRefreshToken(): boolean {
    if (!this.hasTokens()) return false;

    // 액세스 토큰이 만료되었거나 곧 만료될 예정인 경우
    return !this.isTokenValid() || this.isTokenExpiringSoon();
  }

  /**
   * Authorization 헤더 값 생성
   */
  getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * 디버그 정보 출력 (개발 환경에서만)
   */
  debugTokens(): void {
    if (process.env.NODE_ENV !== 'development') return;

    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    console.group('🔑 Token Debug Info');
    console.log('Has Access Token:', !!accessToken);
    console.log('Has Refresh Token:', !!refreshToken);

    if (accessToken) {
      console.log('Access Token Valid:', this.isTokenValid(accessToken));
      console.log('Expires In:', this.getTimeUntilExpiration(accessToken), 'seconds');
      console.log('User Info:', this.getUserFromToken(accessToken));
    }

    console.groupEnd();
  }
}

// Singleton instance
export const tokenStorage = new TokenStorage();
