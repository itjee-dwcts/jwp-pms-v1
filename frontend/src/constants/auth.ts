// ============================================================================
// constants/auth.ts - 인증 관련 상수 정의
// ============================================================================

// ============================================================================
// 인증 상태
// ============================================================================
export const AUTH_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
} as const;

export type AuthStatus = typeof AUTH_STATUS[keyof typeof AUTH_STATUS];

// ============================================================================
// 로그인 방법
// ============================================================================
export const LOGIN_METHOD = {
  EMAIL: 'email',
  GOOGLE: 'google',
  GITHUB: 'github',
  SSO: 'sso',
} as const;

export type LoginMethod = typeof LOGIN_METHOD[keyof typeof LOGIN_METHOD];

// ============================================================================
// 세션 상태
// ============================================================================
export const SESSION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  INVALID: 'invalid',
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

// ============================================================================
// 2FA 상태
// ============================================================================
export const TWO_FA_STATUS = {
  DISABLED: 'disabled',
  ENABLED: 'enabled',
  PENDING: 'pending',
  REQUIRED: 'required',
} as const;

export type TwoFAStatus = typeof TWO_FA_STATUS[keyof typeof TWO_FA_STATUS];

// ============================================================================
// 비밀번호 강도
// ============================================================================
export const PASSWORD_STRENGTH = {
  WEAK: 'weak',
  FAIR: 'fair',
  GOOD: 'good',
  STRONG: 'strong',
} as const;

export type PasswordStrength = typeof PASSWORD_STRENGTH[keyof typeof PASSWORD_STRENGTH];

// ============================================================================
// 라벨 매핑
// ============================================================================

export const AUTH_STATUS_LABELS: Record<AuthStatus, string> = {
  [AUTH_STATUS.LOADING]: '로딩 중',
  [AUTH_STATUS.AUTHENTICATED]: '인증됨',
  [AUTH_STATUS.UNAUTHENTICATED]: '미인증',
  [AUTH_STATUS.ERROR]: '오류',
};

export const LOGIN_METHOD_LABELS: Record<LoginMethod, string> = {
  [LOGIN_METHOD.EMAIL]: '이메일',
  [LOGIN_METHOD.GOOGLE]: 'Google',
  [LOGIN_METHOD.GITHUB]: 'GitHub',
  [LOGIN_METHOD.SSO]: 'SSO',
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  [SESSION_STATUS.ACTIVE]: '활성',
  [SESSION_STATUS.EXPIRED]: '만료됨',
  [SESSION_STATUS.REVOKED]: '취소됨',
  [SESSION_STATUS.INVALID]: '유효하지 않음',
};

export const TWO_FA_STATUS_LABELS: Record<TwoFAStatus, string> = {
  [TWO_FA_STATUS.DISABLED]: '비활성화',
  [TWO_FA_STATUS.ENABLED]: '활성화',
  [TWO_FA_STATUS.PENDING]: '설정 중',
  [TWO_FA_STATUS.REQUIRED]: '필수',
};

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  [PASSWORD_STRENGTH.WEAK]: '약함',
  [PASSWORD_STRENGTH.FAIR]: '보통',
  [PASSWORD_STRENGTH.GOOD]: '좋음',
  [PASSWORD_STRENGTH.STRONG]: '강함',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const AUTH_STATUS_COLORS: Record<AuthStatus, string> = {
  [AUTH_STATUS.LOADING]: 'blue',
  [AUTH_STATUS.AUTHENTICATED]: 'green',
  [AUTH_STATUS.UNAUTHENTICATED]: 'gray',
  [AUTH_STATUS.ERROR]: 'red',
};

export const LOGIN_METHOD_COLORS: Record<LoginMethod, string> = {
  [LOGIN_METHOD.EMAIL]: 'blue',
  [LOGIN_METHOD.GOOGLE]: 'red',
  [LOGIN_METHOD.GITHUB]: 'gray',
  [LOGIN_METHOD.SSO]: 'purple',
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  [SESSION_STATUS.ACTIVE]: 'green',
  [SESSION_STATUS.EXPIRED]: 'yellow',
  [SESSION_STATUS.REVOKED]: 'red',
  [SESSION_STATUS.INVALID]: 'gray',
};

export const TWO_FA_STATUS_COLORS: Record<TwoFAStatus, string> = {
  [TWO_FA_STATUS.DISABLED]: 'gray',
  [TWO_FA_STATUS.ENABLED]: 'green',
  [TWO_FA_STATUS.PENDING]: 'yellow',
  [TWO_FA_STATUS.REQUIRED]: 'red',
};

export const PASSWORD_STRENGTH_COLORS: Record<PasswordStrength, string> = {
  [PASSWORD_STRENGTH.WEAK]: 'red',
  [PASSWORD_STRENGTH.FAIR]: 'orange',
  [PASSWORD_STRENGTH.GOOD]: 'yellow',
  [PASSWORD_STRENGTH.STRONG]: 'green',
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const AUTH_STATUS_OPTIONS = Object.entries(AUTH_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as AuthStatus, label })
);

export const LOGIN_METHOD_OPTIONS = Object.entries(LOGIN_METHOD_LABELS).map(
  ([value, label]) => ({ value: value as LoginMethod, label })
);

export const SESSION_STATUS_OPTIONS = Object.entries(SESSION_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as SessionStatus, label })
);

export const TWO_FA_STATUS_OPTIONS = Object.entries(TWO_FA_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as TwoFAStatus, label })
);

export const PASSWORD_STRENGTH_OPTIONS = Object.entries(PASSWORD_STRENGTH_LABELS).map(
  ([value, label]) => ({ value: value as PasswordStrength, label })
);

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidAuthStatus = (status: string): status is AuthStatus => {
  return Object.values(AUTH_STATUS).includes(status as AuthStatus);
};

export const isValidLoginMethod = (method: string): method is LoginMethod => {
  return Object.values(LOGIN_METHOD).includes(method as LoginMethod);
};

export const isValidSessionStatus = (status: string): status is SessionStatus => {
  return Object.values(SESSION_STATUS).includes(status as SessionStatus);
};

export const isValidTwoFAStatus = (status: string): status is TwoFAStatus => {
  return Object.values(TWO_FA_STATUS).includes(status as TwoFAStatus);
};

export const isValidPasswordStrength = (strength: string): strength is PasswordStrength => {
  return Object.values(PASSWORD_STRENGTH).includes(strength as PasswordStrength);
};

export const isAuthenticated = (status: AuthStatus): boolean => {
  return status === AUTH_STATUS.AUTHENTICATED;
};

export const isUnauthenticated = (status: AuthStatus): boolean => {
  return status === AUTH_STATUS.UNAUTHENTICATED;
};

export const isAuthLoading = (status: AuthStatus): boolean => {
  return status === AUTH_STATUS.LOADING;
};

export const isAuthError = (status: AuthStatus): boolean => {
  return status === AUTH_STATUS.ERROR;
};

export const isSessionActive = (status: SessionStatus): boolean => {
  return status === SESSION_STATUS.ACTIVE;
};

export const isSessionExpired = (status: SessionStatus): boolean => {
  return status === SESSION_STATUS.EXPIRED;
};

export const isSessionRevoked = (status: SessionStatus): boolean => {
  return status === SESSION_STATUS.REVOKED;
};

export const isSessionInvalid = (status: SessionStatus): boolean => {
  return status === SESSION_STATUS.INVALID;
};

export const isTwoFAEnabled = (status: TwoFAStatus): boolean => {
  return status === TWO_FA_STATUS.ENABLED;
};

export const isTwoFARequired = (status: TwoFAStatus): boolean => {
  return status === TWO_FA_STATUS.REQUIRED;
};

export const isTwoFAPending = (status: TwoFAStatus): boolean => {
  return status === TWO_FA_STATUS.PENDING;
};

export const getAuthStatusIcon = (status: AuthStatus): string => {
  const iconMap = {
    [AUTH_STATUS.LOADING]: '⏳',
    [AUTH_STATUS.AUTHENTICATED]: '✅',
    [AUTH_STATUS.UNAUTHENTICATED]: '❌',
    [AUTH_STATUS.ERROR]: '⚠️',
  };

  return iconMap[status];
};

export const getLoginMethodIcon = (method: LoginMethod): string => {
  const iconMap = {
    [LOGIN_METHOD.EMAIL]: '📧',
    [LOGIN_METHOD.GOOGLE]: '🔍',
    [LOGIN_METHOD.GITHUB]: '🐙',
    [LOGIN_METHOD.SSO]: '🔐',
  };

  return iconMap[method];
};

export const getSessionStatusIcon = (status: SessionStatus): string => {
  const iconMap = {
    [SESSION_STATUS.ACTIVE]: '🟢',
    [SESSION_STATUS.EXPIRED]: '🟡',
    [SESSION_STATUS.REVOKED]: '🔴',
    [SESSION_STATUS.INVALID]: '⚫',
  };

  return iconMap[status];
};

export const getTwoFAStatusIcon = (status: TwoFAStatus): string => {
  const iconMap = {
    [TWO_FA_STATUS.DISABLED]: '🔓',
    [TWO_FA_STATUS.ENABLED]: '🔒',
    [TWO_FA_STATUS.PENDING]: '⏳',
    [TWO_FA_STATUS.REQUIRED]: '🚨',
  };

  return iconMap[status];
};

export const getPasswordStrengthIcon = (strength: PasswordStrength): string => {
  const iconMap = {
    [PASSWORD_STRENGTH.WEAK]: '🔴',
    [PASSWORD_STRENGTH.FAIR]: '🟠',
    [PASSWORD_STRENGTH.GOOD]: '🟡',
    [PASSWORD_STRENGTH.STRONG]: '🟢',
  };

  return iconMap[strength];
};

export const getPasswordStrengthScore = (strength: PasswordStrength): number => {
  const scoreMap = {
    [PASSWORD_STRENGTH.WEAK]: 25,
    [PASSWORD_STRENGTH.FAIR]: 50,
    [PASSWORD_STRENGTH.GOOD]: 75,
    [PASSWORD_STRENGTH.STRONG]: 100,
  };

  return scoreMap[strength];
};

// 비밀번호 강도 계산
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;

  // 길이 체크
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // 문자 종류 체크
  if (/[a-z]/.test(password)) score += 1; // 소문자
  if (/[A-Z]/.test(password)) score += 1; // 대문자
  if (/[0-9]/.test(password)) score += 1; // 숫자
  if (/[^A-Za-z0-9]/.test(password)) score += 1; // 특수문자

  // 연속 문자 체크 (감점)
  if (/(.)\1{2,}/.test(password)) score -= 1; // 같은 문자 3개 이상
  if (/123|abc|qwe/i.test(password)) score -= 1; // 연속된 문자

  if (score <= 2) return PASSWORD_STRENGTH.WEAK;
  if (score <= 3) return PASSWORD_STRENGTH.FAIR;
  if (score <= 4) return PASSWORD_STRENGTH.GOOD;
  return PASSWORD_STRENGTH.STRONG;
};

// 토큰 만료 시간 체크
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true; // 토큰 파싱 실패 시 만료된 것으로 처리
  }
};

// 토큰 만료까지 남은 시간 (초)
export const getTokenTimeToExpiry = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    const currentTime = Date.now() / 1000;
    return Math.max(0, payload.exp - currentTime);
  } catch {
    return 0;
  }
};

// 로그인 방법별 요구사항
export const getLoginMethodRequirements = (method: LoginMethod): {
  twoFARequired: boolean;
  emailVerificationRequired: boolean;
  strongPasswordRequired: boolean;
} => {
  const requirementsMap = {
    [LOGIN_METHOD.EMAIL]: {
      twoFARequired: false,
      emailVerificationRequired: true,
      strongPasswordRequired: true,
    },
    [LOGIN_METHOD.GOOGLE]: {
      twoFARequired: false,
      emailVerificationRequired: false,
      strongPasswordRequired: false,
    },
    [LOGIN_METHOD.GITHUB]: {
      twoFARequired: false,
      emailVerificationRequired: false,
      strongPasswordRequired: false,
    },
    [LOGIN_METHOD.SSO]: {
      twoFARequired: true,
      emailVerificationRequired: false,
      strongPasswordRequired: false,
    },
  };

  return requirementsMap[method];
};

// 세션 만료 임계값 (초)
export const SESSION_EXPIRY_WARNING_THRESHOLD = 5 * 60; // 5분
export const SESSION_REFRESH_THRESHOLD = 15 * 60; // 15분

// 비밀번호 정책
export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  MAX_CONSECUTIVE_CHARS: 2,
  HISTORY_CHECK_COUNT: 5, // 이전 5개 비밀번호와 중복 체크
} as const;

// 로그인 시도 제한
export const LOGIN_ATTEMPT_POLICY = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15분 (밀리초)
  RESET_WINDOW: 60 * 60 * 1000, // 1시간 (밀리초)
} as const;
