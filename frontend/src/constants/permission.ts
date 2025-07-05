// ============================================================================
// constants/permission.ts - 권한 관련 상수 정의
// ============================================================================

// ============================================================================
// 권한
// ============================================================================
export const PERMISSION = {
  // User permissions
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_INVITE: 'users.invite',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  USERS_VIEW_ACTIVITY: 'users.view_activity',

  // Project permissions
  PROJECTS_READ: 'projects.read',
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',
  PROJECTS_MANAGE_MEMBERS: 'projects.manage_members',
  PROJECTS_VIEW_ALL: 'projects.view_all',
  PROJECTS_ARCHIVE: 'projects.archive',

  // Task permissions
  TASKS_READ: 'tasks.read',
  TASKS_CREATE: 'tasks.create',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',
  TASKS_ASSIGN: 'tasks.assign',
  TASKS_VIEW_ALL: 'tasks.view_all',
  TASKS_MANAGE_ALL: 'tasks.manage_all',

  // Calendar permissions
  CALENDAR_READ: 'calendar.read',
  CALENDAR_CREATE: 'calendar.create',
  CALENDAR_UPDATE: 'calendar.update',
  CALENDAR_DELETE: 'calendar.delete',
  CALENDAR_MANAGE_ALL: 'calendar.manage_all',
  CALENDAR_VIEW_ALL: 'calendar.view_all',

  // Admin permissions
  ADMIN_SYSTEM_SETTINGS: 'admin.system_settings',
  ADMIN_USER_MANAGEMENT: 'admin.user_management',
  ADMIN_VIEW_LOGS: 'admin.view_logs',
  ADMIN_EXPORT_DATA: 'admin.export_data',
  ADMIN_MANAGE_INTEGRATIONS: 'admin.manage_integrations',

  // Report permissions
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_ADMIN: 'reports.admin',

  // File permissions
  FILES_UPLOAD: 'files.upload',
  FILES_DOWNLOAD: 'files.download',
  FILES_DELETE: 'files.delete',
  FILES_MANAGE_ALL: 'files.manage_all',
} as const;

export type Permission = typeof PERMISSION[keyof typeof PERMISSION];

// ============================================================================
// 역할
// ============================================================================
export const ROLE = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
  VIEWER: 'viewer',
  GUEST: 'guest',
} as const;

export type Role = typeof ROLE[keyof typeof ROLE];

// ============================================================================
// 라벨 매핑
// ============================================================================

export const PERMISSION_LABELS: Record<Permission, string> = {
  // User permissions
  [PERMISSION.USERS_READ]: '사용자 조회',
  [PERMISSION.USERS_CREATE]: '사용자 생성',
  [PERMISSION.USERS_UPDATE]: '사용자 수정',
  [PERMISSION.USERS_DELETE]: '사용자 삭제',
  [PERMISSION.USERS_INVITE]: '사용자 초대',
  [PERMISSION.USERS_MANAGE_ROLES]: '사용자 역할 관리',
  [PERMISSION.USERS_VIEW_ACTIVITY]: '사용자 활동 조회',

  // Project permissions
  [PERMISSION.PROJECTS_READ]: '프로젝트 조회',
  [PERMISSION.PROJECTS_CREATE]: '프로젝트 생성',
  [PERMISSION.PROJECTS_UPDATE]: '프로젝트 수정',
  [PERMISSION.PROJECTS_DELETE]: '프로젝트 삭제',
  [PERMISSION.PROJECTS_MANAGE_MEMBERS]: '프로젝트 멤버 관리',
  [PERMISSION.PROJECTS_VIEW_ALL]: '모든 프로젝트 조회',
  [PERMISSION.PROJECTS_ARCHIVE]: '프로젝트 보관',

  // Task permissions
  [PERMISSION.TASKS_READ]: '작업 조회',
  [PERMISSION.TASKS_CREATE]: '작업 생성',
  [PERMISSION.TASKS_UPDATE]: '작업 수정',
  [PERMISSION.TASKS_DELETE]: '작업 삭제',
  [PERMISSION.TASKS_ASSIGN]: '작업 할당',
  [PERMISSION.TASKS_VIEW_ALL]: '모든 작업 조회',
  [PERMISSION.TASKS_MANAGE_ALL]: '모든 작업 관리',

  // Calendar permissions
  [PERMISSION.CALENDAR_READ]: '캘린더 조회',
  [PERMISSION.CALENDAR_CREATE]: '이벤트 생성',
  [PERMISSION.CALENDAR_UPDATE]: '이벤트 수정',
  [PERMISSION.CALENDAR_DELETE]: '이벤트 삭제',
  [PERMISSION.CALENDAR_MANAGE_ALL]: '모든 캘린더 관리',
  [PERMISSION.CALENDAR_VIEW_ALL]: '모든 캘린더 조회',

  // Admin permissions
  [PERMISSION.ADMIN_SYSTEM_SETTINGS]: '시스템 설정',
  [PERMISSION.ADMIN_USER_MANAGEMENT]: '사용자 관리',
  [PERMISSION.ADMIN_VIEW_LOGS]: '로그 조회',
  [PERMISSION.ADMIN_EXPORT_DATA]: '데이터 내보내기',
  [PERMISSION.ADMIN_MANAGE_INTEGRATIONS]: '통합 관리',

  // Report permissions
  [PERMISSION.REPORTS_VIEW]: '보고서 조회',
  [PERMISSION.REPORTS_CREATE]: '보고서 생성',
  [PERMISSION.REPORTS_EXPORT]: '보고서 내보내기',
  [PERMISSION.REPORTS_ADMIN]: '보고서 관리',

  // File permissions
  [PERMISSION.FILES_UPLOAD]: '파일 업로드',
  [PERMISSION.FILES_DOWNLOAD]: '파일 다운로드',
  [PERMISSION.FILES_DELETE]: '파일 삭제',
  [PERMISSION.FILES_MANAGE_ALL]: '모든 파일 관리',
};

export const ROLE_LABELS: Record<Role, string> = {
  [ROLE.ADMIN]: '관리자',
  [ROLE.MANAGER]: '매니저',
  [ROLE.DEVELOPER]: '개발자',
  [ROLE.VIEWER]: '조회자',
  [ROLE.GUEST]: '게스트',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const ROLE_COLORS: Record<Role, string> = {
  [ROLE.ADMIN]: 'red',
  [ROLE.MANAGER]: 'purple',
  [ROLE.DEVELOPER]: 'blue',
  [ROLE.VIEWER]: 'green',
  [ROLE.GUEST]: 'gray',
};

// ============================================================================
// 권한 그룹화
// ============================================================================

export const PERMISSION_GROUPS = {
  USERS: [
    PERMISSION.USERS_READ,
    PERMISSION.USERS_CREATE,
    PERMISSION.USERS_UPDATE,
    PERMISSION.USERS_DELETE,
    PERMISSION.USERS_INVITE,
    PERMISSION.USERS_MANAGE_ROLES,
    PERMISSION.USERS_VIEW_ACTIVITY,
  ],
  PROJECTS: [
    PERMISSION.PROJECTS_READ,
    PERMISSION.PROJECTS_CREATE,
    PERMISSION.PROJECTS_UPDATE,
    PERMISSION.PROJECTS_DELETE,
    PERMISSION.PROJECTS_MANAGE_MEMBERS,
    PERMISSION.PROJECTS_VIEW_ALL,
    PERMISSION.PROJECTS_ARCHIVE,
  ],
  TASKS: [
    PERMISSION.TASKS_READ,
    PERMISSION.TASKS_CREATE,
    PERMISSION.TASKS_UPDATE,
    PERMISSION.TASKS_DELETE,
    PERMISSION.TASKS_ASSIGN,
    PERMISSION.TASKS_VIEW_ALL,
    PERMISSION.TASKS_MANAGE_ALL,
  ],
  CALENDAR: [
    PERMISSION.CALENDAR_READ,
    PERMISSION.CALENDAR_CREATE,
    PERMISSION.CALENDAR_UPDATE,
    PERMISSION.CALENDAR_DELETE,
    PERMISSION.CALENDAR_MANAGE_ALL,
    PERMISSION.CALENDAR_VIEW_ALL,
  ],
  ADMIN: [
    PERMISSION.ADMIN_SYSTEM_SETTINGS,
    PERMISSION.ADMIN_USER_MANAGEMENT,
    PERMISSION.ADMIN_VIEW_LOGS,
    PERMISSION.ADMIN_EXPORT_DATA,
    PERMISSION.ADMIN_MANAGE_INTEGRATIONS,
  ],
  REPORTS: [
    PERMISSION.REPORTS_VIEW,
    PERMISSION.REPORTS_CREATE,
    PERMISSION.REPORTS_EXPORT,
    PERMISSION.REPORTS_ADMIN,
  ],
  FILES: [
    PERMISSION.FILES_UPLOAD,
    PERMISSION.FILES_DOWNLOAD,
    PERMISSION.FILES_DELETE,
    PERMISSION.FILES_MANAGE_ALL,
  ],
} as const;

export const PERMISSION_GROUP_LABELS = {
  USERS: '사용자 관리',
  PROJECTS: '프로젝트 관리',
  TASKS: '작업 관리',
  CALENDAR: '캘린더 관리',
  ADMIN: '시스템 관리',
  REPORTS: '보고서 관리',
  FILES: '파일 관리',
} as const;

// ============================================================================
// 역할별 기본 권한
// ============================================================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLE.ADMIN]: [
    // 모든 권한
    ...PERMISSION_GROUPS.USERS,
    ...PERMISSION_GROUPS.PROJECTS,
    ...PERMISSION_GROUPS.TASKS,
    ...PERMISSION_GROUPS.CALENDAR,
    ...PERMISSION_GROUPS.ADMIN,
    ...PERMISSION_GROUPS.REPORTS,
    ...PERMISSION_GROUPS.FILES,
  ],
  [ROLE.MANAGER]: [
    // 사용자 관리 (제한적)
    PERMISSION.USERS_READ,
    PERMISSION.USERS_INVITE,
    PERMISSION.USERS_VIEW_ACTIVITY,
    // 프로젝트 관리
    ...PERMISSION_GROUPS.PROJECTS,
    // 작업 관리
    ...PERMISSION_GROUPS.TASKS,
    // 캘린더 관리
    ...PERMISSION_GROUPS.CALENDAR,
    // 보고서 관리
    ...PERMISSION_GROUPS.REPORTS,
    // 파일 관리 (제한적)
    PERMISSION.FILES_UPLOAD,
    PERMISSION.FILES_DOWNLOAD,
    PERMISSION.FILES_DELETE,
  ],
  [ROLE.DEVELOPER]: [
    // 프로젝트 조회/수정
    PERMISSION.PROJECTS_READ,
    PERMISSION.PROJECTS_UPDATE,
    // 작업 관리
    PERMISSION.TASKS_READ,
    PERMISSION.TASKS_CREATE,
    PERMISSION.TASKS_UPDATE,
    PERMISSION.TASKS_ASSIGN,
    // 캘린더
    PERMISSION.CALENDAR_READ,
    PERMISSION.CALENDAR_CREATE,
    PERMISSION.CALENDAR_UPDATE,
    // 보고서 조회
    PERMISSION.REPORTS_VIEW,
    // 파일 관리
    PERMISSION.FILES_UPLOAD,
    PERMISSION.FILES_DOWNLOAD,
  ],
  [ROLE.VIEWER]: [
    // 조회 권한만
    PERMISSION.PROJECTS_READ,
    PERMISSION.TASKS_READ,
    PERMISSION.CALENDAR_READ,
    PERMISSION.REPORTS_VIEW,
    PERMISSION.FILES_DOWNLOAD,
  ],
  [ROLE.GUEST]: [
    // 최소 권한
    PERMISSION.PROJECTS_READ,
    PERMISSION.TASKS_READ,
  ],
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(
  ([value, label]) => ({ value: value as Role, label })
);

export const PERMISSION_OPTIONS = Object.entries(PERMISSION_LABELS).map(
  ([value, label]) => ({ value: value as Permission, label })
);

export const PERMISSION_GROUP_OPTIONS = Object.entries(PERMISSION_GROUP_LABELS).map(
  ([value, label]) => ({
    value,
    label,
    permissions: PERMISSION_GROUPS[value as keyof typeof PERMISSION_GROUPS]
  })
);

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidPermission = (permission: string): permission is Permission => {
  return Object.values(PERMISSION).includes(permission as Permission);
};

export const isValidRole = (role: string): role is Role => {
  return Object.values(ROLE).includes(role as Role);
};

export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

export const getRolePermissions = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const isAdminRole = (role: Role): boolean => {
  return role === ROLE.ADMIN;
};

export const isManagerRole = (role: Role): boolean => {
  return ([ROLE.ADMIN, ROLE.MANAGER] as Role[]).includes(role);
};

export const canManageUsers = (role: Role): boolean => {
  const permissions = getRolePermissions(role);
  return permissions.includes(PERMISSION.USERS_MANAGE_ROLES);
};

export const canManageProjects = (role: Role): boolean => {
  const permissions = getRolePermissions(role);
  return permissions.includes(PERMISSION.PROJECTS_MANAGE_MEMBERS);
};

export const canViewAllData = (role: Role): boolean => {
  const permissions = getRolePermissions(role);
  return permissions.includes(PERMISSION.PROJECTS_VIEW_ALL) &&
         permissions.includes(PERMISSION.TASKS_VIEW_ALL);
};

export const getRoleIcon = (role: Role): string => {
  const iconMap = {
    [ROLE.ADMIN]: '👑',
    [ROLE.MANAGER]: '🔧',
    [ROLE.DEVELOPER]: '💻',
    [ROLE.VIEWER]: '👁️',
    [ROLE.GUEST]: '👤',
  };

  return iconMap[role];
};

export const getPermissionIcon = (permission: Permission): string => {
  const iconMap: Record<string, string> = {
    // User permissions
    'users.read': '👥',
    'users.create': '👤➕',
    'users.update': '👤✏️',
    'users.delete': '👤❌',
    'users.invite': '📧',
    'users.manage_roles': '🔐',
    'users.view_activity': '📊',

    // Project permissions
    'projects.read': '📁',
    'projects.create': '📁➕',
    'projects.update': '📁✏️',
    'projects.delete': '📁❌',
    'projects.manage_members': '👥🔧',
    'projects.view_all': '📁👁️',
    'projects.archive': '📦',

    // Task permissions
    'tasks.read': '✅',
    'tasks.create': '✅➕',
    'tasks.update': '✅✏️',
    'tasks.delete': '✅❌',
    'tasks.assign': '✅👤',
    'tasks.view_all': '✅👁️',
    'tasks.manage_all': '✅🔧',

    // Calendar permissions
    'calendar.read': '📅',
    'calendar.create': '📅➕',
    'calendar.update': '📅✏️',
    'calendar.delete': '📅❌',
    'calendar.manage_all': '📅🔧',
    'calendar.view_all': '📅👁️',

    // Admin permissions
    'admin.system_settings': '⚙️',
    'admin.user_management': '👥🔧',
    'admin.view_logs': '📋',
    'admin.export_data': '📤',
    'admin.manage_integrations': '🔗',

    // Report permissions
    'reports.view': '📊',
    'reports.create': '📊➕',
    'reports.export': '📊📤',
    'reports.admin': '📊🔧',

    // File permissions
    'files.upload': '📁⬆️',
    'files.download': '📁⬇️',
    'files.delete': '📁❌',
    'files.manage_all': '📁🔧',
  };

  return iconMap[permission] || '🔒';
};

export const getRoleWeight = (role: Role): number => {
  const weightMap = {
    [ROLE.GUEST]: 1,
    [ROLE.VIEWER]: 2,
    [ROLE.DEVELOPER]: 3,
    [ROLE.MANAGER]: 4,
    [ROLE.ADMIN]: 5,
  };

  return weightMap[role];
};

export const compareRoles = (role1: Role, role2: Role): number => {
  return getRoleWeight(role1) - getRoleWeight(role2);
};
