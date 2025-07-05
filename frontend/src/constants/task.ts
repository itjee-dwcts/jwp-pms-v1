// ============================================================================
// constants/task.ts - 작업 관련 상수 정의
// ============================================================================

// ============================================================================
// 작업 상태
// ============================================================================
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// ============================================================================
// 작업 우선순위
// ============================================================================
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type TaskPriority = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

// ============================================================================
// 작업 타입
// ============================================================================
export const TASK_TYPE = {
  TASK: 'task',
  BUG: 'bug',
  FEATURE: 'feature',
  IMPROVEMENT: 'improvement',
  RESEARCH: 'research',
} as const;

export type TaskType = typeof TASK_TYPE[keyof typeof TASK_TYPE];

// ============================================================================
// 의존성 타입
// ============================================================================
export const DEPENDENCY_TYPE = {
  BLOCKS: 'blocks',
  BLOCKED_BY: 'blocked_by',
  RELATES_TO: 'relates_to',
} as const;

export type DependencyType = typeof DEPENDENCY_TYPE[keyof typeof DEPENDENCY_TYPE];

// ============================================================================
// 라벨 매핑
// ============================================================================

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TASK_STATUS.TODO]: '할 일',
  [TASK_STATUS.IN_PROGRESS]: '진행 중',
  [TASK_STATUS.IN_REVIEW]: '검토 중',
  [TASK_STATUS.DONE]: '완료',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.LOW]: '낮음',
  [TASK_PRIORITY.MEDIUM]: '보통',
  [TASK_PRIORITY.HIGH]: '높음',
  [TASK_PRIORITY.CRITICAL]: '긴급',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TASK_TYPE.TASK]: '작업',
  [TASK_TYPE.BUG]: '버그',
  [TASK_TYPE.FEATURE]: '기능',
  [TASK_TYPE.IMPROVEMENT]: '개선',
  [TASK_TYPE.RESEARCH]: '조사',
};

export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, string> = {
  [DEPENDENCY_TYPE.BLOCKS]: '차단함',
  [DEPENDENCY_TYPE.BLOCKED_BY]: '차단됨',
  [DEPENDENCY_TYPE.RELATES_TO]: '관련됨',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TASK_STATUS.TODO]: 'gray',
  [TASK_STATUS.IN_PROGRESS]: 'blue',
  [TASK_STATUS.IN_REVIEW]: 'yellow',
  [TASK_STATUS.DONE]: 'green',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.LOW]: 'gray',
  [TASK_PRIORITY.MEDIUM]: 'blue',
  [TASK_PRIORITY.HIGH]: 'orange',
  [TASK_PRIORITY.CRITICAL]: 'red',
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  [TASK_TYPE.TASK]: 'blue',
  [TASK_TYPE.BUG]: 'red',
  [TASK_TYPE.FEATURE]: 'green',
  [TASK_TYPE.IMPROVEMENT]: 'orange',
  [TASK_TYPE.RESEARCH]: 'purple',
};

export const DEPENDENCY_TYPE_COLORS: Record<DependencyType, string> = {
  [DEPENDENCY_TYPE.BLOCKS]: 'red',
  [DEPENDENCY_TYPE.BLOCKED_BY]: 'orange',
  [DEPENDENCY_TYPE.RELATES_TO]: 'blue',
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as TaskStatus, label })
);

export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_LABELS).map(
  ([value, label]) => ({ value: value as TaskPriority, label })
);

export const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as TaskType, label })
);

export const DEPENDENCY_TYPE_OPTIONS = Object.entries(DEPENDENCY_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as DependencyType, label })
);

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidTaskStatus = (status: string): status is TaskStatus => {
  return Object.values(TASK_STATUS).includes(status as TaskStatus);
};

export const isValidTaskPriority = (priority: string): priority is TaskPriority => {
  return Object.values(TASK_PRIORITY).includes(priority as TaskPriority);
};

export const isValidTaskType = (type: string): type is TaskType => {
  return Object.values(TASK_TYPE).includes(type as TaskType);
};

export const isValidDependencyType = (type: string): type is DependencyType => {
  return Object.values(DEPENDENCY_TYPE).includes(type as DependencyType);
};

export const isTaskCompleted = (status: TaskStatus): boolean => {
  return status === TASK_STATUS.DONE;
};

export const isTaskInProgress = (status: TaskStatus): boolean => {
  return ([TASK_STATUS.IN_PROGRESS, TASK_STATUS.IN_REVIEW] as TaskStatus[]).includes(status);
};

export const isTaskPending = (status: TaskStatus): boolean => {
  return status === TASK_STATUS.TODO;
};

export const getNextTaskStatus = (currentStatus: TaskStatus): TaskStatus | null => {
  const statusFlow = [
    TASK_STATUS.TODO,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.IN_REVIEW,
    TASK_STATUS.DONE
  ];

  const currentIndex = statusFlow.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
    return null;
  }

  return statusFlow[currentIndex + 1] as TaskStatus;
};

export const getPreviousTaskStatus = (currentStatus: TaskStatus): TaskStatus | null => {
  const statusFlow = [
    TASK_STATUS.TODO,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.IN_REVIEW,
    TASK_STATUS.DONE
  ];

  const currentIndex = statusFlow.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === 0) {
    return null;
  }

    return statusFlow[currentIndex - 1] as TaskStatus;
};

export const getTaskStatusProgress = (status: TaskStatus): number => {
  const progressMap = {
    [TASK_STATUS.TODO]: 0,
    [TASK_STATUS.IN_PROGRESS]: 33,
    [TASK_STATUS.IN_REVIEW]: 66,
    [TASK_STATUS.DONE]: 100,
  };

  return progressMap[status];
};

export const getTaskTypeIcon = (type: TaskType): string => {
  const iconMap = {
    [TASK_TYPE.TASK]: '📋',
    [TASK_TYPE.BUG]: '🐛',
    [TASK_TYPE.FEATURE]: '✨',
    [TASK_TYPE.IMPROVEMENT]: '🔧',
    [TASK_TYPE.RESEARCH]: '🔍',
  };

  return iconMap[type];
};

export const getTaskStatusIcon = (status: TaskStatus): string => {
  const iconMap = {
    [TASK_STATUS.TODO]: '📝',
    [TASK_STATUS.IN_PROGRESS]: '🔄',
    [TASK_STATUS.IN_REVIEW]: '👀',
    [TASK_STATUS.DONE]: '✅',
  };

  return iconMap[status];
};

export const getTaskPriorityIcon = (priority: TaskPriority): string => {
  const iconMap = {
    [TASK_PRIORITY.LOW]: '⬇️',
    [TASK_PRIORITY.MEDIUM]: '➡️',
    [TASK_PRIORITY.HIGH]: '⬆️',
    [TASK_PRIORITY.CRITICAL]: '🚨',
  };

  return iconMap[priority];
};

export const getDependencyTypeIcon = (type: DependencyType): string => {
  const iconMap = {
    [DEPENDENCY_TYPE.BLOCKS]: '🚫',
    [DEPENDENCY_TYPE.BLOCKED_BY]: '⛔',
    [DEPENDENCY_TYPE.RELATES_TO]: '🔗',
  };

  return iconMap[type];
};

export const getTaskPriorityWeight = (priority: TaskPriority): number => {
  const weightMap = {
    [TASK_PRIORITY.LOW]: 1,
    [TASK_PRIORITY.MEDIUM]: 2,
    [TASK_PRIORITY.HIGH]: 3,
    [TASK_PRIORITY.CRITICAL]: 4,
  };

  return weightMap[priority];
};

// 작업 타입별 우선순위 (정렬용)
export const getTaskTypeWeight = (type: TaskType): number => {
  const weightMap = {
    [TASK_TYPE.BUG]: 4,        // 버그가 최우선
    [TASK_TYPE.FEATURE]: 3,    // 기능 개발
    [TASK_TYPE.IMPROVEMENT]: 2, // 개선
    [TASK_TYPE.TASK]: 1,       // 일반 작업
    [TASK_TYPE.RESEARCH]: 0,   // 조사는 낮은 우선순위
  };

  return weightMap[type];
};
