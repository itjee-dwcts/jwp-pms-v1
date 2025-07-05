// ============================================================================
// 사용자 관련 타입
// ============================================================================

export interface UserPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  task_reminders: boolean;
  project_updates: boolean;
  calendar_reminders: boolean;
  weekly_digest: boolean;
  theme: string;
  language: string;
  date_format: string;
  time_format: string;
}

export interface UserStats {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  hours_logged: number;
  last_activity: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  timezone?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;

  // 확장 필드 (선택적)
  preferences?: UserPreferences;
  stats?: UserStats;
  project_count?: number;
  completed_tasks_count?: number;
  active_tasks_count?: number;
  contribution_score?: number;
}

// ============================================================================
// 인증 요청/응답 타입
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
  two_factor_code?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  terms_accepted?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user: User;
  message?: string;
  requires_verification?: boolean;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user?: User;
}

// ============================================================================
// 프로필 및 비밀번호 관리
// ============================================================================

export interface UpdateProfileRequest {
  full_name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  timezone?: string;
  avatar_url?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  new_password: string;
}

// ============================================================================
// OAuth 관련 타입
// ============================================================================

export interface OAuthProvider {
  name: 'google' | 'github' | 'microsoft';
  display_name: string;
  icon?: string;
  url: string;
}

export interface OAuthCallbackRequest {
  code: string;
  state?: string;
  provider: string;
}

// ============================================================================
// 2단계 인증 관련 타입
// ============================================================================

export interface TwoFactorSetupResponse {
  qr_code: string;
  secret: string;
  backup_codes: string[];
}

export interface TwoFactorVerificationRequest {
  code: string;
  backup_code?: boolean;
}

// ============================================================================
// 세션 관리
// ============================================================================

export interface UserSession {
  id: string;
  user_id: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  is_current: boolean;
  last_activity: string;
  expires_at: string;
  created_at: string;
}

export interface SessionListResponse {
  sessions: UserSession[];
  total: number;
}

// ============================================================================
// 계정 설정 및 보안
// ============================================================================

export interface AccountSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  two_factor_enabled: boolean;
  session_timeout: number;
  timezone: string;
  language: string;
  theme: string;
}

export interface AccountSecurityInfo {
  two_factor_enabled: boolean;
  last_password_change: string;
  active_sessions_count: number;
  recent_login_attempts: Array<{
    ip_address: string;
    timestamp: string;
    success: boolean;
    user_agent?: string;
  }>;
}

// ============================================================================
// 상태 관리 타입
// ============================================================================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  // 기본 인증
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (credentials: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshToken: (token?: string) => Promise<void>;

  // 사용자 관리
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;

  // 비밀번호 재설정
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;

  // 이메일 인증
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;

  // OAuth
  getOAuthUrl: (provider: string) => string;
  handleOAuthCallback: (provider: string, code: string, state?: string) => Promise<LoginResponse>;

  // 2단계 인증
  enable2FA: () => Promise<TwoFactorSetupResponse>;
  disable2FA: (code: string) => Promise<void>;
  verify2FA: (code: string) => Promise<LoginResponse>;

  // 상태 관리
  checkAuthStatus: () => Promise<void>;
  getCurrentUser: () => Promise<User>;
  clearError: () => void;
  reset: () => void;

  // 내부 상태 설정
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
}

export type AuthContextType = AuthState & AuthActions;

// ============================================================================
// 토큰 관련 타입
// ============================================================================

export interface TokenPayload {
  sub: string;  // 사용자 ID
  email: string;
  role?: string;
  name?: string;
  iat: number;  // 발급 시간
  exp: number;  // 만료 시간
  aud?: string; // 대상
  iss?: string; // 발급자
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

// ============================================================================
// 오류 처리 타입
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
  details?: ValidationError[];
}

// ============================================================================
// API 응답 타입
// ============================================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: AuthError;
  message: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// 폼 데이터 타입
// ============================================================================

export interface LoginFormData {
  username: string;
  password: string;
  remember_me: boolean;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  terms_accepted: boolean;
}

export interface ProfileFormData {
  full_name: string;
  bio: string;
  phone: string;
  location: string;
  website: string;
  timezone: string;
}

export interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ============================================================================
// 활동 로그 타입
// ============================================================================

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  extra_data?: Record<string, any>;
}

// ============================================================================
// 훅 반환 타입
// ============================================================================

export interface UseAuthReturn extends AuthState {
  actions: AuthActions;
  utils: {
    isLoggedIn: boolean;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    isTokenValid: () => boolean;
    getTokenExpiration: () => number | null;
  };
}

// ============================================================================
// 라우트 보호 타입
// ============================================================================

export interface AuthRoute {
  path: string;
  component: React.ComponentType;
  requiresAuth: boolean;
  requiredRole?: string;
  redirect?: string;
}

// ============================================================================
// 레거시 타입 별칭 (하위 호환성)
// ============================================================================

/** @deprecated Use LoginRequest instead */
export type LoginCredentials = LoginRequest;

/** @deprecated Use RegisterRequest instead */
export type RegisterCredentials = RegisterRequest;

/** @deprecated Use ChangePasswordRequest instead */
export type PasswordChangeRequest = ChangePasswordRequest;
