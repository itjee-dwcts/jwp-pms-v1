// ============================================================================
// 환경 설정 타입 정의
// ============================================================================

export interface EnvironmentConfig {
  TOKEN_STORAGE_KEY: string;
  REFRESH_TOKEN_STORAGE_KEY: string;
  TOKEN_REFRESH_THRESHOLD: number;
  API_BASE_URL: string;
  GRAPHQL_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  ENABLE_DARK_MODE: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_CALENDAR: boolean;
  ENABLE_GANTT_CHART: boolean;
  GOOGLE_CLIENT_ID?: string;
  GITHUB_CLIENT_ID?: string;
  SENTRY_DSN?: string;
  DEBUG_MODE: boolean;
}

/**
 * 애플리케이션 설정
 * 환경 변수에서 설정을 불러오며 기본값 제공
 */
export const config: EnvironmentConfig = {
  // API 설정
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001',
  GRAPHQL_URL: process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:8001/graphql',

  // 애플리케이션 정보
  APP_NAME: process.env.REACT_APP_APP_NAME || 'PMS',
  APP_VERSION: process.env.REACT_APP_APP_VERSION || '1.0.0',

  // 기능 플래그
  ENABLE_DARK_MODE: process.env.REACT_APP_ENABLE_DARK_MODE === 'true',
  ENABLE_NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_CALENDAR: process.env.REACT_APP_ENABLE_CALENDAR === 'true',
  ENABLE_GANTT_CHART: process.env.REACT_APP_ENABLE_GANTT_CHART === 'true',

  // 외부 서비스
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  GITHUB_CLIENT_ID: process.env.REACT_APP_GITHUB_CLIENT_ID || '',
  SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN || '',

  // 개발 환경
  DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development',

  // 토큰 설정
  TOKEN_STORAGE_KEY: 'pms_token',
  REFRESH_TOKEN_STORAGE_KEY: 'pms_refresh_token',
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5분
};

/**
 * API 엔드포인트 설정
 */
export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    PROFILE: '/auth/profile',
  },

  // 사용자 관리
  USERS: {
    LIST: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    AVATAR: (id: string) => `/users/${id}/avatar`,
  },

  // 프로젝트 관리
  PROJECTS: {
    LIST: '/projects',
    DETAIL: (id: string) => `/projects/${id}`,
    CREATE: '/projects',
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    MEMBERS: (id: string) => `/projects/${id}/members`,
    COMMENTS: (id: string) => `/projects/${id}/comments`,
    ATTACHMENTS: (id: string) => `/projects/${id}/attachments`,
    ANALYTICS: (id: string) => `/projects/${id}/analytics`,
  },

  // 작업 관리
  TASKS: {
    LIST: '/tasks',
    DETAIL: (id: string) => `/tasks/${id}`,
    CREATE: '/tasks',
    UPDATE: (id: string) => `/tasks/${id}`,
    DELETE: (id: string) => `/tasks/${id}`,
    ASSIGN: (id: string) => `/tasks/${id}/assign`,
    UNASSIGN: (id: string) => `/tasks/${id}/unassign`,
    COMMENTS: (id: string) => `/tasks/${id}/comments`,
    ATTACHMENTS: (id: string) => `/tasks/${id}/attachments`,
    TIME_LOG: (id: string) => `/tasks/${id}/time-log`,
  },

  // 댓글 관리
  COMMENTS: {
    LIST: '/comments',
    DETAIL: (id: string) => `/comments/${id}`,
    CREATE: '/comments',
    UPDATE: (id: string) => `/comments/${id}`,
    DELETE: (id: string) => `/comments/${id}`,
  },

  // 일정/이벤트 관리
  EVENTS: {
    LIST: '/events',
    DETAIL: (id: string) => `/events/${id}`,
    CREATE: '/events',
    UPDATE: (id: string) => `/events/${id}`,
    DELETE: (id: string) => `/events/${id}`,
  },

  // 첨부파일 관리
  ATTACHMENTS: {
    UPLOAD: '/attachments/upload',
    DOWNLOAD: (id: string) => `/attachments/${id}/download`,
    DELETE: (id: string) => `/attachments/${id}`,
  },

  // 대시보드
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ACTIVITY: '/dashboard/activity',
    ANALYTICS: '/dashboard/analytics',
  },

  // 알림
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
  },

  // 설정
  SETTINGS: {
    USER: '/settings/user',
    THEME: '/settings/theme',
    NOTIFICATIONS: '/settings/notifications',
  },

  // 관리자
  ADMIN: {
    USERS: '/admin/users',
    ROLES: '/admin/roles',
    PERMISSIONS: '/admin/permissions',
    SYSTEM: '/admin/system',
    LOGS: '/admin/logs',
  },

  // 채팅 (AI 어시스턴트)
  CHAT: {
    // 채팅 세션 관리
    SESSIONS: {
      LIST: '/api/v1/chat/sessions',
      DETAIL: (id: string) => `/api/v1/chat/sessions/${id}`,
      CREATE: '/api/v1/chat/sessions',
      UPDATE: (id: string) => `/api/v1/chat/sessions/${id}`,
      DELETE: (id: string) => `/api/v1/chat/sessions/${id}`,
      DUPLICATE: (id: string) => `/api/v1/chat/sessions/${id}/duplicate`,
      ARCHIVE: (id: string) => `/api/v1/chat/sessions/${id}/archive`,
      RESTORE: (id: string) => `/api/v1/chat/sessions/${id}/restore`,
      EXPORT: (id: string) => `/api/v1/chat/sessions/${id}/export`,
      IMPORT: '/api/v1/chat/import',
      SUMMARIZE: (id: string) => `/api/v1/chat/sessions/${id}/summarize`,
    },

    // 채팅 메시지 관리
    MESSAGES: {
      LIST: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/messages`,
      CREATE: '/api/v1/chat/messages',
      DETAIL: (id: string) => `/api/v1/chat/messages/${id}`,
      UPDATE: (id: string) => `/api/v1/chat/messages/${id}`,
      DELETE: (id: string) => `/api/v1/chat/messages/${id}`,
      REGENERATE: (id: string) => `/api/v1/chat/messages/${id}/regenerate`,
      FEEDBACK: (id: string) => `/api/v1/chat/messages/${id}/feedback`,
    },

    // OpenAI API 연동
    OPENAI: {
      SEND: '/api/v1/chat/send',
      SEND_STREAM: '/api/v1/chat/send-stream',
    },

    // 채팅 템플릿 관리
    TEMPLATES: {
      LIST: '/api/v1/chat/templates',
      DETAIL: (id: string) => `/api/v1/chat/templates/${id}`,
      CREATE: '/api/v1/chat/templates',
      UPDATE: (id: string) => `/api/v1/chat/templates/${id}`,
      DELETE: (id: string) => `/api/v1/chat/templates/${id}`,
      USE: (id: string) => `/api/v1/chat/templates/${id}/use`,
      LIKE: (id: string) => `/api/v1/chat/templates/${id}/like`,
    },

    // 채팅 파일 관리
    FILES: {
      LIST: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/files`,
      UPLOAD: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/files`,
      DELETE: (sessionId: string, fileId: string) => `/api/v1/chat/sessions/${sessionId}/files/${fileId}`,
    },

    // 채팅 통계 및 설정
    STATS: {
      USAGE: '/api/v1/chat/usage-stats',
      SUMMARY: '/api/v1/chat/stats/summary',
    },

    // 채팅 검색
    SEARCH: '/api/v1/chat/search',

    // 채팅 설정 및 시스템
    SETTINGS: '/api/v1/chat/settings',
    SYSTEM_STATUS: '/api/v1/chat/system/status',
  },
};

/**
 * 애플리케이션 상수
 */
export const APP_CONSTANTS = {
  // 페이지네이션
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // 파일 업로드
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  MAX_FILES_PER_UPLOAD: 5,

  // 토큰 관리
  TOKEN_STORAGE_KEY: 'pms_token',
  REFRESH_TOKEN_STORAGE_KEY: 'pms_refresh_token',
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5분

  // 테마 설정
  THEME_STORAGE_KEY: 'pms_theme',

  // 캐시 키
  CACHE_KEYS: {
    USER_PROFILE: 'user_profile',
    PROJECTS: 'projects',
    TASKS: 'tasks',
    DASHBOARD_STATS: 'dashboard_stats',
    CHAT_SESSIONS: 'chat_sessions',
    CHAT_TEMPLATES: 'chat_templates',
  },

  // 디바운스 지연 시간
  SEARCH_DEBOUNCE: 300,
  AUTO_SAVE_DEBOUNCE: 1000,

  // 날짜 형식
  DATE_FORMAT: 'yyyy-MM-dd',
  DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  TIME_FORMAT: 'HH:mm',

  // 유효성 검사
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,

  // UI 설정
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,

  // 알림 설정
  TOAST_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },

  // 색상 설정
  STATUS_COLORS: {
    // 프로젝트 상태
    planning: '#6b7280',
    active: '#3b82f6',
    on_hold: '#f59e0b',
    completed: '#10b981',
    cancelled: '#ef4444',

    // 작업 상태
    todo: '#6b7280',
    in_progress: '#3b82f6',
    in_review: '#f59e0b',
    done: '#10b981',

    // 우선순위
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',

    // 채팅 상태
    chat_active: '#3b82f6',
    chat_inactive: '#6b7280',
    chat_archived: '#9ca3af',
  },

  // 차트 색상
  CHART_COLORS: [
    '#3b82f6', // 파랑
    '#10b981', // 초록
    '#f59e0b', // 노랑
    '#ef4444', // 빨강
    '#8b5cf6', // 보라
    '#06b6d4', // 청록
    '#f97316', // 주황
    '#84cc16', // 라임
    '#ec4899', // 분홍
    '#6b7280', // 회색
  ],

  // 채팅 관련 상수
  CHAT: {
    MAX_MESSAGE_LENGTH: 4000,
    MAX_SESSIONS_PER_USER: 100,
    MAX_MESSAGES_PER_SESSION: 1000,
    MESSAGE_LOAD_LIMIT: 50,
    SESSION_AUTO_SAVE_DELAY: 2000,
    TYPING_INDICATOR_DELAY: 500,
    MAX_FILE_SIZE_CHAT: 20 * 1024 * 1024, // 20MB (채팅용)
    SUPPORTED_CHAT_FILE_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/json',
    ],
    DEFAULT_MODEL: 'gpt-4-turbo',
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 4000,
  },
};

/**
 * GraphQL 설정
 */
export const GRAPHQL_CONFIG = {
  URI: config.GRAPHQL_URL,
  WS_URI: config.GRAPHQL_URL.replace('http', 'ws').replace('https', 'wss'),

  // 캐시 설정
  CACHE_CONFIG: {
    typePolicies: {
      Project: {
        fields: {
          tasks: {
            merge: false,
          },
          members: {
            merge: false,
          },
        },
      },
      Task: {
        fields: {
          comments: {
            merge: false,
          },
          assignees: {
            merge: false,
          },
        },
      },
      ChatSession: {
        fields: {
          messages: {
            merge: false,
          },
        },
      },
      ChatMessage: {
        fields: {
          attachments: {
            merge: false,
          },
        },
      },
    },
  },

  // 에러 처리 설정
  ERROR_LINK_CONFIG: {
    errorHandler: (error: any) => {
      console.error('GraphQL 오류:', error);
      // 추가 에러 처리 로직
    },
  },
};

/**
 * 개발 환경 설정
 */
export const DEV_CONFIG = {
  MOCK_API: process.env.REACT_APP_MOCK_API === 'true',
  ENABLE_REDUX_DEVTOOLS: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || 'info',
  ENABLE_PERFORMANCE_MONITORING: process.env.REACT_APP_PERFORMANCE_MONITORING === 'true',
};

/**
 * 기능 플래그 설정
 */
export const FEATURE_FLAGS = {
  DARK_MODE: config.ENABLE_DARK_MODE,
  NOTIFICATIONS: config.ENABLE_NOTIFICATIONS,
  CALENDAR: config.ENABLE_CALENDAR,
  GANTT_CHART: config.ENABLE_GANTT_CHART,
  REAL_TIME: process.env.REACT_APP_ENABLE_REAL_TIME === 'true',
  ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  EXPORT: process.env.REACT_APP_ENABLE_EXPORT === 'true',
  COLLABORATION: process.env.REACT_APP_ENABLE_COLLABORATION === 'true',
  ADVANCED_SEARCH: process.env.REACT_APP_ENABLE_ADVANCED_SEARCH === 'true',
  MOBILE_APP: process.env.REACT_APP_ENABLE_MOBILE_APP === 'true',
  CHAT_AI: process.env.REACT_APP_ENABLE_CHAT_AI === 'true',
  CHAT_TEMPLATES: process.env.REACT_APP_ENABLE_CHAT_TEMPLATES === 'true',
  CHAT_FILE_UPLOAD: process.env.REACT_APP_ENABLE_CHAT_FILE_UPLOAD === 'true',
  CHAT_STREAMING: process.env.REACT_APP_ENABLE_CHAT_STREAMING === 'true',
};

/**
 * 특정 기능이 활성화되어 있는지 확인하는 유틸리티 함수
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature] || false;
};

/**
 * 환경별 설정 가져오기
 */
export const getEnvironment = (): 'development' | 'staging' | 'production' => {
  if (process.env.NODE_ENV === 'development') return 'development';
  if (config.API_BASE_URL.includes('staging')) return 'staging';
  return 'production';
};

/**
 * 개발 모드인지 확인
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * 프로덕션 모드인지 확인
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * 채팅 관련 유틸리티 함수들
 */
export const chatUtils = {
  /**
   * 채팅 세션 제목 생성
   */
  generateSessionTitle: (firstMessage: string): string => {
    if (!firstMessage || firstMessage.trim().length === 0) {
      return '새 채팅';
    }

    const cleanMessage = firstMessage.trim().replace(/\n/g, ' ');
    if (cleanMessage.length <= 50) {
      return cleanMessage;
    }

    const truncated = cleanMessage.substring(0, 50);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > 20) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  },

  /**
   * 상대 시간 표시
   */
  formatRelativeTime: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '방금 전';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}주 전`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}개월 전`;

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}년 전`;
  },

  /**
   * 파일 크기 포맷팅
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 모델별 색상 반환
   */
  getModelColor: (model: string): string => {
    const colorMap: Record<string, string> = {
      'gpt-3.5-turbo': '#10b981',
      'gpt-4': '#3b82f6',
      'gpt-4-turbo': '#8b5cf6',
      'gpt-4-vision-preview': '#f97316',
    };
    return colorMap[model] || '#6b7280';
  },

  /**
   * 메시지 역할별 아이콘 반환
   */
  getMessageRoleIcon: (role: string): string => {
    const iconMap: Record<string, string> = {
      'user': '👤',
      'assistant': '🤖',
      'system': '⚙️',
    };
    return iconMap[role] || '💬';
  },
};

/**
 * 로깅 유틸리티
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment()) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (isDevelopment()) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};

/**
 * 환경별 API URL 빌더
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = config.API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * 기본 HTTP 헤더 생성
 */
export const getDefaultHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-Version': config.APP_VERSION,
    'X-Environment': getEnvironment(),
  };
};

/**
 * 에러 메시지 한글화
 */
export const getLocalizedErrorMessage = (error: any): string => {
  const errorMessages: Record<string, string> = {
    'Network Error': '네트워크 연결을 확인해주세요.',
    'Unauthorized': '로그인이 필요합니다.',
    'Forbidden': '접근 권한이 없습니다.',
    'Not Found': '요청한 리소스를 찾을 수 없습니다.',
    'Internal Server Error': '서버 오류가 발생했습니다.',
    'Bad Request': '잘못된 요청입니다.',
    'Timeout': '요청 시간이 초과되었습니다.',
    'Too Many Requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  };

  if (typeof error === 'string') {
    return errorMessages[error] || error;
  }

  if (error?.message) {
    return errorMessages[error.message] || error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
};

// 기본 내보내기
export default config;
