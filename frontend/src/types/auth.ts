// ============================================================================
// User Types
// ============================================================================

export interface User {
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
  is_active?: boolean;
  is_verified?: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Request Types
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

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  new_password: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  timezone?: string;
  avatar_url?: string;
}

// ============================================================================
// Response Types
// ============================================================================

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

export interface AuthResponse extends LoginResponse {}

// ============================================================================
// OAuth Types
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
// Two-Factor Authentication Types
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
// State Types
// ============================================================================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;  // 변경: loading → isLoading
  error: string | null;
}

// ============================================================================
// Action Types
// ============================================================================

export interface AuthActions {
  // 인증 관련
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (credentials: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshToken: (token?: string) => Promise<boolean>;

  // 사용자 관리
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;

  // 비밀번호 재설정
  requestPasswordReset: (email: string) => Promise<void>;  // 변경: forgotPassword → requestPasswordReset
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;

  // 이메일 인증
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;

  // OAuth
  getOAuthUrl: (provider: string) => string;
  handleOAuthCallback: (provider: string, code: string, state?: string) => Promise<LoginResponse>;

  // 2FA
  enable2FA: () => Promise<TwoFactorSetupResponse>;
  disable2FA: (code: string) => Promise<void>;
  verify2FA: (code: string) => Promise<LoginResponse>;

  // 상태 관리
  checkAuthStatus: () => Promise<void>;  // 변경: checkAuth → checkAuthStatus
  getCurrentUser: () => Promise<User>;
  clearError: () => void;
  reset: () => void;

  // 설정
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
}

export type AuthContextType = AuthState & AuthActions;

// ============================================================================
// Token Types
// ============================================================================

export interface TokenPayload {
  sub: string | number;  // subject (user ID)
  email: string;
  role?: string;
  name?: string;
  iat: number;  // issued at
  exp: number;  // expiration
  aud?: string; // audience
  iss?: string; // issuer
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

// ============================================================================
// Validation Types
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
// Session Types
// ============================================================================

export interface UserSession {
  id: string;
  user_id: number;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  last_activity: string;
  expires_at: string;
  is_current?: boolean;
}

export interface SessionListResponse {
  sessions: UserSession[];
  total: number;
}

// ============================================================================
// Account Types
// ============================================================================

export interface AccountSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  two_factor_enabled: boolean;
  session_timeout: number;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
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
// API Response Types
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
// Form Types
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
// Route Types
// ============================================================================

export interface AuthRoute {
  path: string;
  component: React.ComponentType;
  requiresAuth: boolean;
  requiredRole?: string;
  redirect?: string;
}

// ============================================================================
// Hook Return Types
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
// Legacy Type Aliases (하위 호환성)
// ============================================================================

/** @deprecated Use LoginRequest instead */
export type LoginCredentials = LoginRequest;

/** @deprecated Use RegisterRequest instead */
export type RegisterCredentials = RegisterRequest;

/** @deprecated Use ChangePasswordRequest instead */
export type PasswordChangeRequest = ChangePasswordRequest;
