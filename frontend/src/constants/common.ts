// ============================================================================
// constants/common.ts - 공통 상수 정의
// ============================================================================

// ============================================================================
// 정렬 순서
// ============================================================================
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrder = typeof SORT_ORDER[keyof typeof SORT_ORDER];

// ============================================================================
// 상태 (공통)
// ============================================================================
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
} as const;

export type Status = typeof STATUS[keyof typeof STATUS];

// ============================================================================
// 우선순위 (공통)
// ============================================================================
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

// ============================================================================
// 가시성
// ============================================================================
export const VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
} as const;

export type Visibility = typeof VISIBILITY[keyof typeof VISIBILITY];

// ============================================================================
// 색상 테마
// ============================================================================
export const COLOR_THEME = {
  BLUE: 'blue',
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  PURPLE: 'purple',
  PINK: 'pink',
  INDIGO: 'indigo',
  GRAY: 'gray',
} as const;

export type ColorTheme = typeof COLOR_THEME[keyof typeof COLOR_THEME];

// ============================================================================
// 감사 로그 액션
// ============================================================================
export const AUDIT_ACTION = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import',
  ARCHIVE: 'archive',
  RESTORE: 'restore',
} as const;

export type AuditAction = typeof AUDIT_ACTION[keyof typeof AUDIT_ACTION];

// ============================================================================
// 라벨 매핑
// ============================================================================

export const STATUS_LABELS: Record<Status, string> = {
  [STATUS.ACTIVE]: '활성',
  [STATUS.INACTIVE]: '비활성',
  [STATUS.PENDING]: '대기 중',
  [STATUS.SUSPENDED]: '정지',
  [STATUS.ARCHIVED]: '보관됨',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [PRIORITY.LOW]: '낮음',
  [PRIORITY.MEDIUM]: '보통',
  [PRIORITY.HIGH]: '높음',
  [PRIORITY.CRITICAL]: '긴급',
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  [VISIBILITY.PUBLIC]: '공개',
  [VISIBILITY.PRIVATE]: '비공개',
  [VISIBILITY.INTERNAL]: '내부용',
  [VISIBILITY.CONFIDENTIAL]: '기밀',
};

export const COLOR_THEME_LABELS: Record<ColorTheme, string> = {
  [COLOR_THEME.BLUE]: '파란색',
  [COLOR_THEME.GREEN]: '초록색',
  [COLOR_THEME.YELLOW]: '노란색',
  [COLOR_THEME.RED]: '빨간색',
  [COLOR_THEME.PURPLE]: '보라색',
  [COLOR_THEME.PINK]: '분홍색',
  [COLOR_THEME.INDIGO]: '인디고',
  [COLOR_THEME.GRAY]: '회색',
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  [AUDIT_ACTION.CREATE]: '생성',
  [AUDIT_ACTION.READ]: '조회',
  [AUDIT_ACTION.UPDATE]: '수정',
  [AUDIT_ACTION.DELETE]: '삭제',
  [AUDIT_ACTION.LOGIN]: '로그인',
  [AUDIT_ACTION.LOGOUT]: '로그아웃',
  [AUDIT_ACTION.EXPORT]: '내보내기',
  [AUDIT_ACTION.IMPORT]: '가져오기',
  [AUDIT_ACTION.ARCHIVE]: '보관',
  [AUDIT_ACTION.RESTORE]: '복원',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const STATUS_COLORS: Record<Status, string> = {
  [STATUS.ACTIVE]: 'green',
  [STATUS.INACTIVE]: 'gray',
  [STATUS.PENDING]: 'yellow',
  [STATUS.SUSPENDED]: 'red',
  [STATUS.ARCHIVED]: 'gray',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [PRIORITY.LOW]: 'gray',
  [PRIORITY.MEDIUM]: 'blue',
  [PRIORITY.HIGH]: 'orange',
  [PRIORITY.CRITICAL]: 'red',
};

export const VISIBILITY_COLORS: Record<Visibility, string> = {
  [VISIBILITY.PUBLIC]: 'green',
  [VISIBILITY.PRIVATE]: 'red',
  [VISIBILITY.INTERNAL]: 'blue',
  [VISIBILITY.CONFIDENTIAL]: 'purple',
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value: value as Status, label })
);

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(
  ([value, label]) => ({ value: value as Priority, label })
);

export const VISIBILITY_OPTIONS = Object.entries(VISIBILITY_LABELS).map(
  ([value, label]) => ({ value: value as Visibility, label })
);

export const COLOR_THEME_OPTIONS = Object.entries(COLOR_THEME_LABELS).map(
  ([value, label]) => ({ value: value as ColorTheme, label })
);

export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(
  ([value, label]) => ({ value: value as AuditAction, label })
);

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidStatus = (status: string): status is Status => {
  return Object.values(STATUS).includes(status as Status);
};

export const isValidPriority = (priority: string): priority is Priority => {
  return Object.values(PRIORITY).includes(priority as Priority);
};

export const isValidVisibility = (visibility: string): visibility is Visibility => {
  return Object.values(VISIBILITY).includes(visibility as Visibility);
};

export const isValidColorTheme = (theme: string): theme is ColorTheme => {
  return Object.values(COLOR_THEME).includes(theme as ColorTheme);
};

export const isValidAuditAction = (action: string): action is AuditAction => {
  return Object.values(AUDIT_ACTION).includes(action as AuditAction);
};

export const getPriorityWeight = (priority: Priority): number => {
  const weightMap = {
    [PRIORITY.LOW]: 1,
    [PRIORITY.MEDIUM]: 2,
    [PRIORITY.HIGH]: 3,
    [PRIORITY.CRITICAL]: 4,
  };

  return weightMap[priority];
};

export const getStatusIcon = (status: Status): string => {
  const iconMap = {
    [STATUS.ACTIVE]: '✅',
    [STATUS.INACTIVE]: '⏸️',
    [STATUS.PENDING]: '⏳',
    [STATUS.SUSPENDED]: '🚫',
    [STATUS.ARCHIVED]: '📦',
  };

  return iconMap[status];
};

export const getPriorityIcon = (priority: Priority): string => {
  const iconMap = {
    [PRIORITY.LOW]: '⬇️',
    [PRIORITY.MEDIUM]: '➡️',
    [PRIORITY.HIGH]: '⬆️',
    [PRIORITY.CRITICAL]: '🚨',
  };

  return iconMap[priority];
};
