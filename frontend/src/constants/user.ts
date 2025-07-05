// ============================================================================
// constants/user.ts - 사용자 관련 상수 정의
// ============================================================================

import { ROLE, type Role, ROLE as USER_ROLE } from './permission';

// ============================================================================
// 사용자 상태
// ============================================================================
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

// ============================================================================
// 사용자 역할 (재수출)
// ============================================================================
export { ROLE as USER_ROLE };
export type UserRole = Role;

// ============================================================================
// 라벨 매핑
// ============================================================================

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [USER_STATUS.ACTIVE]: '활성',
  [USER_STATUS.INACTIVE]: '비활성',
  [USER_STATUS.PENDING]: '승인 대기',
  [USER_STATUS.SUSPENDED]: '정지',
  [USER_STATUS.ARCHIVED]: '보관됨',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLE.ADMIN]: '관리자',
  [USER_ROLE.MANAGER]: '매니저',
  [USER_ROLE.DEVELOPER]: '개발자',
  [USER_ROLE.VIEWER]: '조회자',
  [USER_ROLE.GUEST]: '게스트',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  [USER_STATUS.ACTIVE]: 'green',
  [USER_STATUS.INACTIVE]: 'gray',
  [USER_STATUS.PENDING]: 'yellow',
  [USER_STATUS.SUSPENDED]: 'red',
  [USER_STATUS.ARCHIVED]: 'gray',
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  [USER_ROLE.ADMIN]: 'red',
  [USER_ROLE.MANAGER]: 'purple',
  [USER_ROLE.DEVELOPER]: 'blue',
  [USER_ROLE.VIEWER]: 'green',
  [USER_ROLE.GUEST]: 'gray',
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const USER_STATUS_OPTIONS = Object.entries(USER_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as UserStatus, label })
);

export const USER_ROLE_OPTIONS = Object.entries(USER_ROLE_LABELS).map(
  ([value, label]) => ({ value: value as UserRole, label })
);

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidUserStatus = (status: string): status is UserStatus => {
  return Object.values(USER_STATUS).includes(status as UserStatus);
};

export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(USER_ROLE).includes(role as UserRole);
};

export const isUserActive = (status: UserStatus): boolean => {
  return status === USER_STATUS.ACTIVE;
};

export const isUserInactive = (status: UserStatus): boolean => {
  return ([USER_STATUS.INACTIVE, USER_STATUS.SUSPENDED, USER_STATUS.ARCHIVED] as UserStatus[]).includes(status);
};

export const isUserPending = (status: UserStatus): boolean => {
  return status === USER_STATUS.PENDING;
};

export const isUserSuspended = (status: UserStatus): boolean => {
  return status === USER_STATUS.SUSPENDED;
};

export const isUserArchived = (status: UserStatus): boolean => {
  return status === USER_STATUS.ARCHIVED;
};

export const canUserLogin = (status: UserStatus): boolean => {
  return ([USER_STATUS.ACTIVE] as UserStatus[]).includes(status);
};

export const isAdminUser = (role: UserRole): boolean => {
  return role === USER_ROLE.ADMIN;
};

export const isManagerUser = (role: UserRole): boolean => {
  return ([USER_ROLE.ADMIN, USER_ROLE.MANAGER] as UserRole[]).includes(role);
};

export const isDeveloperUser = (role: UserRole): boolean => {
  return role === USER_ROLE.DEVELOPER;
};

export const isViewerUser = (role: UserRole): boolean => {
  return role === USER_ROLE.VIEWER;
};

export const isGuestUser = (role: UserRole): boolean => {
  return role === USER_ROLE.GUEST;
};

export const getUserStatusIcon = (status: UserStatus): string => {
  const iconMap = {
    [USER_STATUS.ACTIVE]: '✅',
    [USER_STATUS.INACTIVE]: '⏸️',
    [USER_STATUS.PENDING]: '⏳',
    [USER_STATUS.SUSPENDED]: '🚫',
    [USER_STATUS.ARCHIVED]: '📦',
  };

  return iconMap[status];
};

export const getUserRoleIcon = (role: UserRole): string => {
  const iconMap = {
    [USER_ROLE.ADMIN]: '👑',
    [USER_ROLE.MANAGER]: '🔧',
    [USER_ROLE.DEVELOPER]: '💻',
    [USER_ROLE.VIEWER]: '👁️',
    [USER_ROLE.GUEST]: '👤',
  };

  return iconMap[role];
};

export const getUserStatusWeight = (status: UserStatus): number => {
  const weightMap = {
    [USER_STATUS.ACTIVE]: 5,
    [USER_STATUS.PENDING]: 4,
    [USER_STATUS.INACTIVE]: 3,
    [USER_STATUS.SUSPENDED]: 2,
    [USER_STATUS.ARCHIVED]: 1,
  };

  return weightMap[status];
};

export const getUserRoleWeight = (role: UserRole): number => {
  const weightMap = {
    [USER_ROLE.ADMIN]: 5,
    [USER_ROLE.MANAGER]: 4,
    [USER_ROLE.DEVELOPER]: 3,
    [USER_ROLE.VIEWER]: 2,
    [USER_ROLE.GUEST]: 1,
  };

  return weightMap[role];
};

// 사용자 상태 전환 가능 여부
export const canTransitionUserStatus = (from: UserStatus, to: UserStatus): boolean => {
  const allowedTransitions: Record<UserStatus, UserStatus[]> = {
    [USER_STATUS.PENDING]: [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.ARCHIVED],
    [USER_STATUS.ACTIVE]: [USER_STATUS.INACTIVE, USER_STATUS.SUSPENDED, USER_STATUS.ARCHIVED],
    [USER_STATUS.INACTIVE]: [USER_STATUS.ACTIVE, USER_STATUS.ARCHIVED],
    [USER_STATUS.SUSPENDED]: [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.ARCHIVED],
    [USER_STATUS.ARCHIVED]: [], // 보관된 사용자는 상태 변경 불가
  };

  return allowedTransitions[from]?.includes(to) || false;
};

// 역할 변경 가능 여부 (현재 사용자 역할 기준)
export const canChangeUserRole = (currentUserRole: UserRole, targetUserRole: UserRole, newRole: UserRole): boolean => {
  const currentWeight = getUserRoleWeight(currentUserRole);
  const targetWeight = getUserRoleWeight(targetUserRole);
  const newWeight = getUserRoleWeight(newRole);

  // 자신보다 높은 권한의 사용자는 변경할 수 없음
  if (targetWeight >= currentWeight) {
    return false;
  }

  // 자신보다 높은 권한으로 변경할 수 없음
  if (newWeight >= currentWeight) {
    return false;
  }

  return true;
};
