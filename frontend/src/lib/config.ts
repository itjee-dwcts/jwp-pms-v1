import { EnvironmentConfig } from '@/types';

/**
 * Application configuration
 * Loads configuration from environment variables with fallback defaults
 */
export const config: EnvironmentConfig = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001',
  GRAPHQL_URL: process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:8001/graphql',

  // Application Info
  APP_NAME: process.env.REACT_APP_APP_NAME || 'PMS',
  APP_VERSION: process.env.REACT_APP_APP_VERSION || '1.0.0',

  // Feature Flags
  ENABLE_DARK_MODE: process.env.REACT_APP_ENABLE_DARK_MODE === 'true',
  ENABLE_NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_CALENDAR: process.env.REACT_APP_ENABLE_CALENDAR === 'true',
  ENABLE_GANTT_CHART: process.env.REACT_APP_ENABLE_GANTT_CHART === 'true',

  // External Services
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  GITHUB_CLIENT_ID: process.env.REACT_APP_GITHUB_CLIENT_ID,
  SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,

  // Development
  DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development',
};

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Authentication
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

  // Users
  USERS: {
    LIST: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    AVATAR: (id: string) => `/users/${id}/avatar`,
  },

  // Projects
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

  // Tasks
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

  // Comments
  COMMENTS: {
    LIST: '/comments',
    DETAIL: (id: string) => `/comments/${id}`,
    CREATE: '/comments',
    UPDATE: (id: string) => `/comments/${id}`,
    DELETE: (id: string) => `/comments/${id}`,
  },

  // Calendar/Events
  EVENTS: {
    LIST: '/events',
    DETAIL: (id: string) => `/events/${id}`,
    CREATE: '/events',
    UPDATE: (id: string) => `/events/${id}`,
    DELETE: (id: string) => `/events/${id}`,
  },

  // Attachments
  ATTACHMENTS: {
    UPLOAD: '/attachments/upload',
    DOWNLOAD: (id: string) => `/attachments/${id}/download`,
    DELETE: (id: string) => `/attachments/${id}`,
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ACTIVITY: '/dashboard/activity',
    ANALYTICS: '/dashboard/analytics',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
  },

  // Settings
  SETTINGS: {
    USER: '/settings/user',
    THEME: '/settings/theme',
    NOTIFICATIONS: '/settings/notifications',
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    ROLES: '/admin/roles',
    PERMISSIONS: '/admin/permissions',
    SYSTEM: '/admin/system',
    LOGS: '/admin/logs',
  },
};

/**
 * Application constants
 */
export const APP_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // File Upload
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

  // Token
  TOKEN_STORAGE_KEY: 'pms_token',
  REFRESH_TOKEN_STORAGE_KEY: 'pms_refresh_token',
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes

  // Theme
  THEME_STORAGE_KEY: 'pms_theme',

  // Cache
  CACHE_KEYS: {
    USER_PROFILE: 'user_profile',
    PROJECTS: 'projects',
    TASKS: 'tasks',
    DASHBOARD_STATS: 'dashboard_stats',
  },

  // Debounce delays
  SEARCH_DEBOUNCE: 300,
  AUTO_SAVE_DEBOUNCE: 1000,

  // Date formats
  DATE_FORMAT: 'yyyy-MM-dd',
  DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  TIME_FORMAT: 'HH:mm',

  // Validation
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,

  // UI
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,

  // Notifications
  TOAST_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },

  // Colors
  STATUS_COLORS: {
    // Project Status
    planning: '#6b7280',
    active: '#3b82f6',
    on_hold: '#f59e0b',
    completed: '#10b981',
    cancelled: '#ef4444',

    // Task Status
    todo: '#6b7280',
    in_progress: '#3b82f6',
    in_review: '#f59e0b',
    done: '#10b981',

    // Priority
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  },

  // Chart colors
  CHART_COLORS: [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6b7280', // Gray
  ],
};

/**
 * GraphQL configuration
 */
export const GRAPHQL_CONFIG = {
  URI: config.GRAPHQL_URL,
  WS_URI: config.GRAPHQL_URL.replace('http', 'ws').replace('https', 'wss'),

  // Cache configuration
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
    },
  },

  // Error handling
  ERROR_LINK_CONFIG: {
    errorHandler: (error: any) => {
      console.error('GraphQL Error:', error);
      // Additional error handling logic
    },
  },
};

/**
 * Development configuration
 */
export const DEV_CONFIG = {
  MOCK_API: process.env.REACT_APP_MOCK_API === 'true',
  ENABLE_REDUX_DEVTOOLS: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || 'info',
  ENABLE_PERFORMANCE_MONITORING: process.env.REACT_APP_PERFORMANCE_MONITORING === 'true',
};

/**
 * Feature flags configuration
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
};

/**
 * Utility function to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature] || false;
};

/**
 * Get environment-specific configuration
 */
export const getEnvironment = (): 'development' | 'staging' | 'production' => {
  if (process.env.NODE_ENV === 'development') return 'development';
  if (config.API_BASE_URL.includes('staging')) return 'staging';
  return 'production';
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};
