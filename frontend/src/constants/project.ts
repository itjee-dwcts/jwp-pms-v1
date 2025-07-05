// ============================================================================
// constants/project.ts - 프로젝트 관련 상수 정의
// ============================================================================

// ============================================================================
// 프로젝트 상태
// ============================================================================
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// ============================================================================
// 프로젝트 우선순위
// ============================================================================
export const PROJECT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type ProjectPriority = typeof PROJECT_PRIORITY[keyof typeof PROJECT_PRIORITY];

// ============================================================================
// 프로젝트 멤버 역할
// ============================================================================
export const PROJECT_MEMBER_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type ProjectMemberRole = typeof PROJECT_MEMBER_ROLE[keyof typeof PROJECT_MEMBER_ROLE];

// ============================================================================
// 라벨 매핑
// ============================================================================

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [PROJECT_STATUS.PLANNING]: '기획 중',
  [PROJECT_STATUS.ACTIVE]: '진행 중',
  [PROJECT_STATUS.ON_HOLD]: '보류',
  [PROJECT_STATUS.COMPLETED]: '완료',
  [PROJECT_STATUS.CANCELLED]: '취소',
};

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  [PROJECT_PRIORITY.LOW]: '낮음',
  [PROJECT_PRIORITY.MEDIUM]: '보통',
  [PROJECT_PRIORITY.HIGH]: '높음',
  [PROJECT_PRIORITY.CRITICAL]: '긴급',
};

export const PROJECT_MEMBER_ROLE_LABELS: Record<ProjectMemberRole, string> = {
  [PROJECT_MEMBER_ROLE.OWNER]: '소유자',
  [PROJECT_MEMBER_ROLE.ADMIN]: '관리자',
  [PROJECT_MEMBER_ROLE.MEMBER]: '멤버',
  [PROJECT_MEMBER_ROLE.VIEWER]: '보기 권한',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [PROJECT_STATUS.PLANNING]: 'blue',
  [PROJECT_STATUS.ACTIVE]: 'green',
  [PROJECT_STATUS.ON_HOLD]: 'yellow',
  [PROJECT_STATUS.COMPLETED]: 'gray',
  [PROJECT_STATUS.CANCELLED]: 'red',
};

export const PROJECT_PRIORITY_COLORS: Record<ProjectPriority, string> = {
  [PROJECT_PRIORITY.LOW]: 'gray',
  [PROJECT_PRIORITY.MEDIUM]: 'blue',
  [PROJECT_PRIORITY.HIGH]: 'orange',
  [PROJECT_PRIORITY.CRITICAL]: 'red',
};

export const PROJECT_MEMBER_ROLE_COLORS: Record<ProjectMemberRole, string> = {
  [PROJECT_MEMBER_ROLE.OWNER]: 'purple',
  [PROJECT_MEMBER_ROLE.ADMIN]: 'red',
  [PROJECT_MEMBER_ROLE.MEMBER]: 'blue',
  [PROJECT_MEMBER_ROLE.VIEWER]: 'gray',
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const PROJECT_STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as ProjectStatus, label })
);

export const PROJECT_PRIORITY_OPTIONS = Object.entries(PROJECT_PRIORITY_LABELS).map(
  ([value, label]) => ({ value: value as ProjectPriority, label })
);

export const PROJECT_MEMBER_ROLE_OPTIONS = Object.entries(PROJECT_MEMBER_ROLE_LABELS).map(
  ([value, label]) => ({ value: value as ProjectMemberRole, label })
);

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidProjectStatus = (status: string): status is ProjectStatus => {
  return Object.values(PROJECT_STATUS).includes(status as ProjectStatus);
};

export const isValidProjectPriority = (priority: string): priority is ProjectPriority => {
  return Object.values(PROJECT_PRIORITY).includes(priority as ProjectPriority);
};

export const isValidProjectMemberRole = (role: string): role is ProjectMemberRole => {
  return Object.values(PROJECT_MEMBER_ROLE).includes(role as ProjectMemberRole);
};

export const isProjectActive = (status: ProjectStatus): boolean => {
  return status === PROJECT_STATUS.ACTIVE;
};

export const isProjectCompleted = (status: ProjectStatus): boolean => {
  return ([PROJECT_STATUS.COMPLETED, PROJECT_STATUS.CANCELLED] as ProjectStatus[]).includes(status);
};

export const isProjectInProgress = (status: ProjectStatus): boolean => {
  return ([PROJECT_STATUS.PLANNING, PROJECT_STATUS.ACTIVE, PROJECT_STATUS.ON_HOLD] as ProjectStatus[]).includes(status);
};

export const getProjectStatusIcon = (status: ProjectStatus): string => {
  const iconMap = {
    [PROJECT_STATUS.PLANNING]: '📋',
    [PROJECT_STATUS.ACTIVE]: '🚀',
    [PROJECT_STATUS.ON_HOLD]: '⏸️',
    [PROJECT_STATUS.COMPLETED]: '✅',
    [PROJECT_STATUS.CANCELLED]: '❌',
  };

  return iconMap[status];
};

export const getProjectPriorityIcon = (priority: ProjectPriority): string => {
  const iconMap = {
    [PROJECT_PRIORITY.LOW]: '⬇️',
    [PROJECT_PRIORITY.MEDIUM]: '➡️',
    [PROJECT_PRIORITY.HIGH]: '⬆️',
    [PROJECT_PRIORITY.CRITICAL]: '🚨',
  };

  return iconMap[priority];
};

export const getProjectMemberRoleIcon = (role: ProjectMemberRole): string => {
  const iconMap = {
    [PROJECT_MEMBER_ROLE.OWNER]: '👑',
    [PROJECT_MEMBER_ROLE.ADMIN]: '🔧',
    [PROJECT_MEMBER_ROLE.MEMBER]: '👤',
    [PROJECT_MEMBER_ROLE.VIEWER]: '👁️',
  };

  return iconMap[role];
};

export const getProjectPriorityWeight = (priority: ProjectPriority): number => {
  const weightMap = {
    [PROJECT_PRIORITY.LOW]: 1,
    [PROJECT_PRIORITY.MEDIUM]: 2,
    [PROJECT_PRIORITY.HIGH]: 3,
    [PROJECT_PRIORITY.CRITICAL]: 4,
  };

  return weightMap[priority];
};

export const getProjectMemberRoleWeight = (role: ProjectMemberRole): number => {
  const weightMap = {
    [PROJECT_MEMBER_ROLE.VIEWER]: 1,
    [PROJECT_MEMBER_ROLE.MEMBER]: 2,
    [PROJECT_MEMBER_ROLE.ADMIN]: 3,
    [PROJECT_MEMBER_ROLE.OWNER]: 4,
  };

  return weightMap[role];
};

// 프로젝트 상태 진행률 계산
export const getProjectStatusProgress = (status: ProjectStatus): number => {
  const progressMap = {
    [PROJECT_STATUS.PLANNING]: 10,
    [PROJECT_STATUS.ACTIVE]: 50,
    [PROJECT_STATUS.ON_HOLD]: 50,
    [PROJECT_STATUS.COMPLETED]: 100,
    [PROJECT_STATUS.CANCELLED]: 0,
  };

  return progressMap[status];
};
