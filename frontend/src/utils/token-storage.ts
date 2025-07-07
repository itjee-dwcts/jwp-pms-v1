/**
 * 토큰 저장소 유틸리티
 * 액세스 토큰과 리프레시 토큰을 안전하게 관리합니다.
 * JWT 토큰의 유효성 검사, 만료 시간 확인, 자동 갱신 등의 기능을 제공합니다.
 */

const ACCESS_TOKEN_KEY = 'pms_access_token';
const REFRESH_TOKEN_KEY = 'pms_refresh_token';
const TOKEN_TIMESTAMP_KEY = 'pms_token_timestamp';

// 토큰 저장 옵션 인터페이스
interface TokenSetOptions {
  rememberMe?: boolean;
  expiresIn?: number; // 초 단위
}

// 토큰 정보 인터페이스
interface TokenInfo {
  token: string;
  isValid: boolean;
  expiresAt: number | null;
  expiresIn: number | null; // 초 단위
  user: any | null;
}

export class TokenStorage {
  private static instance: TokenStorage;

  /**
   * 싱글톤 패턴 구현
   */
  public static getInstance(): TokenStorage {
    if (!TokenStorage.instance) {
      TokenStorage.instance = new TokenStorage();
    }
    return TokenStorage.instance;
  }

  /**
   * 저장소 사용 가능 여부 확인
   */
  private isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('로컬스토리지를 사용할 수 없습니다:', error);
      return false;
    }
  }

  /**
   * 안전한 localStorage 작업을 위한 래퍼
   */
  private setItem(key: string, value: string): boolean {
    if (!this.isStorageAvailable()) return false;

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`${key} 저장에 실패했습니다:`, error);
      return false;
    }
  }

  /**
   * 안전한 localStorage 조회를 위한 래퍼
   */
  private getItem(key: string): string | null {
    if (!this.isStorageAvailable()) return null;

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`${key} 조회에 실패했습니다:`, error);
      return null;
    }
  }

  /**
   * 안전한 localStorage 삭제를 위한 래퍼
   */
  private removeItem(key: string): boolean {
    if (!this.isStorageAvailable()) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`${key} 삭제에 실패했습니다:`, error);
      return false;
    }
  }

  /**
   * 액세스 토큰 저장
   */
  setAccessToken(token: string, options: TokenSetOptions = {}): boolean {
    const success = this.setItem(ACCESS_TOKEN_KEY, token);

    console.log(`✅ 액세스 토큰이 성공적으로 저장되었습니다${options.rememberMe ? ' (기억하기)' : ''}`);

    if (success) {
      // 토큰 저장 시간 기록
      this.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 액세스 토큰이 성공적으로 저장되었습니다');
      }
    }

    return success;
  }

  /**
   * 리프레시 토큰 저장
   */
  setRefreshToken(token: string, options: TokenSetOptions = {}): boolean {
    const success = this.setItem(REFRESH_TOKEN_KEY, token);

    if (success) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ 리프레시 토큰이 성공적으로 저장되었습니다${options.rememberMe ? ' (기억하기)' : ''}`);
      }
    }

    return success;
  }

  /**
   * 토큰들 동시 저장
   */
  setTokens(accessToken: string, refreshToken?: string, options: TokenSetOptions = {}): boolean {
    let success = this.setAccessToken(accessToken, options);

    if (refreshToken) {
      success = success && this.setRefreshToken(refreshToken, options);
    }

    if (success && process.env.NODE_ENV === 'development') {
      console.log('✅ 토큰들이 성공적으로 저장되었습니다');
      this.debugTokens();
    }

    return success;
  }

  /**
   * 액세스 토큰 조회
   */
  getAccessToken(): string | null {
    return this.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * 리프레시 토큰 조회
   */
  getRefreshToken(): string | null {
    return this.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * 토큰 저장 시간 조회
   */
  getTokenTimestamp(): number | null {
    const timestamp = this.getItem(TOKEN_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  }

  /**
   * 토큰 존재 여부 확인
   */
  hasTokens(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * 토큰 유효성 확인 (JWT 형식 및 만료 시간 검사)
   */
  isTokenValid(token?: string): boolean {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) {
      return false;
    }

    try {
      // JWT 형식 검사 (3개 부분으로 구성되어야 함)
      const parts = tokenToCheck.split('.');
      if (parts.length !== 3) {
        throw new Error('잘못된 JWT 형식: 3개 부분으로 구성되어야 합니다');
      }

      // 페이로드 디코딩 및 만료 시간 확인
      const base64Payload = parts[1];
      if (!base64Payload) {
        throw new Error('잘못된 토큰: 페이로드가 누락되었습니다');
      }

      const payload = JSON.parse(atob(base64Payload));

      // 만료 시간이 없는 경우 유효하지 않은 토큰으로 간주
      if (!payload.exp) {
        throw new Error('잘못된 토큰: 만료 시간이 누락되었습니다');
      }

      const currentTime = Date.now() / 1000;
      const isNotExpired = payload.exp > currentTime;

      if (!isNotExpired && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 토큰이 만료되었습니다');
      }

      return isNotExpired;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 토큰 유효성 검사 오류:', error);
      }
      return false;
    }
  }

  /**
   * 토큰 정보 조회 (유효성, 만료 시간, 사용자 정보 포함)
   */
  getTokenInfo(token?: string): TokenInfo | null {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) {
      return null;
    }

    try {
      const parts = tokenToCheck.split('.');
      if (parts.length !== 3) {
        throw new Error('잘못된 JWT 형식');
      }

      const payload = JSON.parse(atob(parts[1] ?? ''));
      const currentTime = Date.now() / 1000;
      const isValid = payload.exp && payload.exp > currentTime;

      return {
        token: tokenToCheck,
        isValid,
        expiresAt: payload.exp || null,
        expiresIn: payload.exp ? Math.max(0, payload.exp - currentTime) : null,
        user: {
          id: payload.sub || payload.user_id,
          email: payload.email,
          username: payload.username,
          role: payload.role,
          name: payload.name || payload.full_name,
          ...payload
        }
      };
    } catch (error) {
      console.error('토큰 정보 파싱에 실패했습니다:', error);
      return null;
    }
  }

  /**
   * 토큰 만료 시간 조회 (Unix timestamp)
   */
  getTokenExpiration(token?: string): number | null {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.expiresAt || null;
  }

  /**
   * 토큰 만료까지 남은 시간 (초 단위)
   */
  getTimeUntilExpiration(token?: string): number | null {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.expiresIn || null;
  }

  /**
   * 토큰이 곧 만료되는지 확인 (기본: 5분)
   */
  isTokenExpiringSoon(token?: string, thresholdSeconds: number = 300): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration(token);
    if (timeUntilExpiration === null) {
      return true; // 토큰이 없거나 유효하지 않으면 만료된 것으로 간주
    }

    return timeUntilExpiration < thresholdSeconds;
  }

  /**
   * 토큰에서 사용자 정보 추출
   */
  getUserFromToken(token?: string): any | null {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.user || null;
  }

  /**
   * 토큰 갱신이 필요한지 확인
   */
  shouldRefreshToken(): boolean {
    if (!this.hasTokens()) {
      return false;
    }

    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return false;
    }

    // 액세스 토큰이 만료되었거나 곧 만료될 예정인 경우
    return !this.isTokenValid(accessToken) || this.isTokenExpiringSoon(accessToken);
  }

  /**
   * Authorization 헤더 값 생성
   */
  getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    if (!token || !this.isTokenValid(token)) {
      return null;
    }
    return `Bearer ${token}`;
  }

  /**
   * 모든 토큰 삭제
   */
  clearTokens(): boolean {
    const results = [
      this.removeItem(ACCESS_TOKEN_KEY),
      this.removeItem(REFRESH_TOKEN_KEY),
      this.removeItem(TOKEN_TIMESTAMP_KEY)
    ];

    const success = results.every(Boolean);

    if (success && process.env.NODE_ENV === 'development') {
      console.log('🗑️ 모든 토큰이 성공적으로 삭제되었습니다');
    }

    return success;
  }

  /**
   * 토큰 상태 확인 (만료, 갱신 필요 등)
   */
  getTokenStatus(): {
    hasToken: boolean;
    isValid: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
    shouldRefresh: boolean;
    expiresIn: number | null;
    user: any | null;
  } {
    const accessToken = this.getAccessToken();
    const tokenInfo = this.getTokenInfo(accessToken ?? undefined);

    return {
      hasToken: !!accessToken,
      isValid: tokenInfo?.isValid || false,
      isExpired: tokenInfo ? !tokenInfo.isValid : true,
      isExpiringSoon: this.isTokenExpiringSoon(accessToken ?? undefined),
      shouldRefresh: this.shouldRefreshToken(),
      expiresIn: tokenInfo?.expiresIn || null,
      user: tokenInfo?.user || null
    };
  }

  /**
   * 토큰 자동 정리 (만료된 토큰 삭제)
   */
  cleanupExpiredTokens(): boolean {
    const status = this.getTokenStatus();

    if (status.hasToken && status.isExpired) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 만료된 토큰을 정리합니다');
      }
      return this.clearTokens();
    }

    return true;
  }

  /**
   * 디버그 정보 출력 (개발 환경에서만)
   */
  debugTokens(): void {
    if (process.env.NODE_ENV !== 'development') return;

    const status = this.getTokenStatus();
    const timestamp = this.getTokenTimestamp();

    console.group('🔑 토큰 디버그 정보');
    console.log('📊 상태:', {
      '토큰 보유': status.hasToken ? '✅' : '❌',
      '유효 여부': status.isValid ? '✅' : '❌',
      '만료 여부': status.isExpired ? '⚠️' : '✅',
      '곧 만료': status.isExpiringSoon ? '⚠️' : '✅',
      '갱신 필요': status.shouldRefresh ? '🔄' : '✅'
    });

    if (timestamp) {
      console.log('⏰ 저장 시간:', new Date(timestamp).toLocaleString());
    }

    if (status.hasToken && status.expiresIn) {
      const expiresAt = new Date(Date.now() + (status.expiresIn * 1000));
      console.log('⏳ 만료 시간:', expiresAt.toLocaleString());
      console.log('⏱️ 남은 시간:', Math.round(status.expiresIn / 60), '분');
    }

    if (status.user) {
      console.log('👤 사용자 정보:', status.user);
    }

    console.groupEnd();
  }

  /**
   * 토큰 검증 및 상태 리포트
   */
  validateAndReport(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const status = this.getTokenStatus();

    // 문제점 확인
    if (!status.hasToken) {
      issues.push('액세스 토큰을 찾을 수 없습니다');
      recommendations.push('로그인하여 토큰을 발급받으세요');
    } else {
      if (status.isExpired) {
        issues.push('액세스 토큰이 만료되었습니다');
        recommendations.push('토큰을 갱신하거나 다시 로그인하세요');
      } else if (status.isExpiringSoon) {
        issues.push('액세스 토큰이 곧 만료됩니다');
        recommendations.push('토큰을 미리 갱신하는 것을 고려하세요');
      }

      if (!this.getRefreshToken()) {
        issues.push('리프레시 토큰을 찾을 수 없습니다');
        recommendations.push('액세스 토큰 만료 시 다시 로그인해야 할 수 있습니다');
      }
    }

    return {
      isValid: status.isValid,
      issues,
      recommendations
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const tokenStorage = TokenStorage.getInstance();

// 개발 환경에서 전역 접근을 위한 설정
if (process.env.NODE_ENV === 'development') {
  (window as any).tokenStorage = tokenStorage;
}
