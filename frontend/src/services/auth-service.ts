import type {
  AccountSecurityInfo,
  AccountSettings,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  SessionListResponse,
  TwoFactorSetupResponse,
  TwoFactorVerificationRequest,
  UpdateProfileRequest,
  User
} from '../types/auth';
import { apiClient } from './api-client';

export class AuthService {
  private readonly baseUrl = '/api/v1/auth';

  // ============================================================================
  // 기본 인증 메서드들
  // ============================================================================

  /**
   * 로그인
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔧 AuthService: 로그인 요청', credentials);
    return apiClient.request<LoginResponse>(`${this.baseUrl}/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * 회원가입
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.request<RegisterResponse>(`${this.baseUrl}/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    await apiClient.request(`${this.baseUrl}/logout`, {
      method: 'POST',
    });
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return apiClient.request<RefreshTokenResponse>(`${this.baseUrl}/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.request<User>(`${this.baseUrl}/me`);
  }

  // ============================================================================
  // 사용자 프로필 관리
  // ============================================================================

  /**
   * 프로필 업데이트
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return apiClient.request<User>(`${this.baseUrl}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 아바타 업로드
   */
  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Avatar upload failed');
    }

    return response.json();
  }

  // ============================================================================
  // 비밀번호 관리
  // ============================================================================

  /**
   * 비밀번호 변경
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.request(`${this.baseUrl}/password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 비밀번호 재설정 요청 (이름 통일)
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/password/reset`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * 비밀번호 찾기 (이메일로 재설정 링크 전송)
   * @deprecated Use requestPasswordReset instead
   */
  async forgotPassword(email: string): Promise<void> {
    await this.requestPasswordReset(email);
  }

  /**
   * 비밀번호 재설정 확인
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.request(`${this.baseUrl}/password/reset/confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // 이메일 인증
  // ============================================================================

  /**
   * 이메일 인증
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/email/verify`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  /**
   * 이메일 인증 재요청
   */
  async resendVerificationEmail(): Promise<void> {
    await apiClient.request(`${this.baseUrl}/email/resend`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // OAuth 인증
  // ============================================================================

  /**
   * OAuth 로그인 URL 생성
   */
  getOAuthUrl(provider: 'google' | 'github' | 'microsoft'): string {
    return `${apiClient.baseUrl}${this.baseUrl}/oauth/${provider}`;
  }

  /**
   * OAuth 콜백 처리
   */
  async handleOAuthCallback(provider: string, code: string, state?: string): Promise<LoginResponse> {
    return apiClient.request<LoginResponse>(`${this.baseUrl}/oauth/${provider}/callback`, {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  // ============================================================================
  // 2단계 인증 (2FA)
  // ============================================================================

  /**
   * 2FA 활성화
   */
  async enable2FA(): Promise<TwoFactorSetupResponse> {
    return apiClient.request<TwoFactorSetupResponse>(
      `${this.baseUrl}/2fa/enable`,
      { method: 'POST' }
    );
  }

  /**
   * 2FA 비활성화
   */
  async disable2FA(code: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/2fa/disable`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  /**
   * 2FA 토큰 확인
   */
  async verify2FA(data: TwoFactorVerificationRequest): Promise<LoginResponse> {
    return apiClient.request<LoginResponse>(`${this.baseUrl}/2fa/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 2FA 백업 코드 재생성
   */
  async regenerateBackupCodes(): Promise<{ backup_codes: string[] }> {
    return apiClient.request<{ backup_codes: string[] }>(
      `${this.baseUrl}/2fa/backup-codes`,
      { method: 'POST' }
    );
  }

  // ============================================================================
  // 세션 관리
  // ============================================================================

  /**
   * 활성 세션 목록 조회
   */
  async getSessions(): Promise<SessionListResponse> {
    return apiClient.request<SessionListResponse>(`${this.baseUrl}/sessions`);
  }

  /**
   * 특정 세션 종료
   */
  async terminateSession(sessionId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 다른 모든 세션 종료
   */
  async terminateOtherSessions(): Promise<void> {
    await apiClient.request(`${this.baseUrl}/sessions/others`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // 계정 설정
  // ============================================================================

  /**
   * 계정 설정 조회
   */
  async getAccountSettings(): Promise<AccountSettings> {
    return apiClient.request<AccountSettings>(`${this.baseUrl}/settings`);
  }

  /**
   * 계정 설정 업데이트
   */
  async updateAccountSettings(settings: Partial<AccountSettings>): Promise<AccountSettings> {
    return apiClient.request<AccountSettings>(`${this.baseUrl}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  /**
   * 계정 보안 정보 조회
   */
  async getSecurityInfo(): Promise<AccountSecurityInfo> {
    return apiClient.request<AccountSecurityInfo>(`${this.baseUrl}/security`);
  }

  // ============================================================================
  // 계정 관리
  // ============================================================================

  /**
   * 계정 비활성화
   */
  async deactivateAccount(password: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  /**
   * 계정 삭제
   */
  async deleteAccount(password: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  /**
   * 데이터 내보내기 요청
   */
  async requestDataExport(): Promise<{ export_id: string }> {
    return apiClient.request<{ export_id: string }>(`${this.baseUrl}/export`, {
      method: 'POST',
    });
  }

  /**
   * 데이터 내보내기 상태 확인
   */
  async getDataExportStatus(exportId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    download_url?: string;
    expires_at?: string;
  }> {
    return apiClient.request(`${this.baseUrl}/export/${exportId}`);
  }
}

// Singleton instance
export const authService = new AuthService();
