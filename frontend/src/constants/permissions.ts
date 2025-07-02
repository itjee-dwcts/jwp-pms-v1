import type { Permission, PermissionGroup, RoleConfig } from '@/types/permission';

// 권한 그룹 정의
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'users',
    description: '사용자 관리',
    permissions: [
      'users.read',
      'users.create',
      'users.update',
      'users.delete',
      'users.invite',
      'users.manage_roles',
      'users.view_activity'
    ]
  },
  {
    name: 'projects',
    description: '프로젝트 관리',
    permissions: [
      'projects.read',
      'projects.create',
      'projects.update',
      'projects.delete',
      'projects.manage_members',
      'projects.view_all',
      'projects.archive'
    ]
  },
  {
    name: 'tasks',
    description: '작업 관리',
    permissions: [
      'tasks.read',
      'tasks.create',
      'tasks.update',
      'tasks.delete',
      'tasks.assign',
      'tasks.view_all',
      'tasks.manage_all'
    ]
  },
  {
    name: 'calendar',
    description: '캘린더 관리',
    permissions: [
      'calendar.read',
      'calendar.create',
      'calendar.update',
      'calendar.delete',
      'calendar.manage_all',
      'calendar.view_all'
    ]
  },
  {
    name: 'reports',
    description: '보고서 관리',
    permissions: [
      'reports.view',
      'reports.create',
      'reports.export',
      'reports.admin'
    ]
  },
  {
    name: 'files',
    description: '파일 관리',
    permissions: [
      'files.upload',
      'files.download',
      'files.delete',
      'files.manage_all'
    ]
  },
  {
    name: 'admin',
    description: '관리자 기능',
    permissions: [
      'admin.system_settings',
      'admin.user_management',
      'admin.view_logs',
      'admin.export_data',
      'admin.manage_integrations'
    ]
  }
];

// 역할 설정 정의
export const DEFAULT_ROLE_CONFIGS: RoleConfig[] = [
  {
    name: 'admin',
    displayName: '관리자',
    description: '모든 권한을 가진 최고 관리자',
    permissions: PERMISSION_GROUPS.flatMap(group => group.permissions) as Permission[]
  },
  {
    name: 'manager',
    displayName: '매니저',
    description: '프로젝트 및 팀 관리자',
    permissions: [
      // 사용자 관리
      'users.read',
      'users.invite',
      'users.view_activity',

      // 프로젝트 관리 (전체)
      'projects.read',
      'projects.create',
      'projects.update',
      'projects.delete',
      'projects.manage_members',
      'projects.view_all',
      'projects.archive',

      // 작업 관리 (전체)
      'tasks.read',
      'tasks.create',
      'tasks.update',
      'tasks.delete',
      'tasks.assign',
      'tasks.view_all',
      'tasks.manage_all',

      // 캘린더 관리
      'calendar.read',
      'calendar.create',
      'calendar.update',
      'calendar.delete',
      'calendar.view_all',

      // 보고서
      'reports.view',
      'reports.create',
      'reports.export',

      // 파일 관리
      'files.upload',
      'files.download',
      'files.delete'
    ]
  },
  {
    name: 'developer',
    displayName: '개발자',
    description: '프로젝트 작업 및 개발 담당자',
    permissions: [
      // 사용자 조회만
      'users.read',

      // 프로젝트 조회 및 참여
      'projects.read',
      'projects.update', // 참여 프로젝트만

      // 작업 관리
      'tasks.read',
      'tasks.create',
      'tasks.update',
      'tasks.assign',

      // 캘린더
      'calendar.read',
      'calendar.create',
      'calendar.update',
      'calendar.delete',

      // 보고서 조회
      'reports.view',

      // 파일 관리
      'files.upload',
      'files.download'
    ]
  },
  {
    name: 'viewer',
    displayName: '뷰어',
    description: '읽기 전용 사용자',
    permissions: [
      // 조회 권한만
      'users.read',
      'projects.read',
      'tasks.read',
      'calendar.read',
      'reports.view',
      'files.download'
    ]
  },
  {
    name: 'guest',
    displayName: '게스트',
    description: '제한된 접근 권한을 가진 임시 사용자',
    permissions: [
      // 최소한의 조회 권한
      'projects.read',
      'tasks.read'
    ]
  }
];

// 권한 상속 관계 정의
export const ROLE_HIERARCHY: Record<string, string[]> = {
  'admin': ['manager', 'developer', 'viewer', 'guest'],
  'manager': ['developer', 'viewer', 'guest'],
  'developer': ['viewer', 'guest'],
  'viewer': ['guest'],
  'guest': []
};

// 권한 체크 유틸리티
export const getAllPermissionsForRole = (roleName: string): Permission[] => {
  const role = DEFAULT_ROLE_CONFIGS.find(role => role.name === roleName);
  if (!role) return [];

  const inheritedPermissions: Permission[] = [];

  // 상속된 역할의 권한도 포함
  if (role.inherits) {
    role.inherits.forEach(inheritedRole => {
      const inherited = getAllPermissionsForRole(inheritedRole);
      inheritedPermissions.push(...inherited);
    });
  }

  // 중복 제거하고 반환
  return Array.from(new Set([...role.permissions, ...inheritedPermissions]));
};

// 특정 권한이 어떤 역할에 속하는지 확인
export const getRolesWithPermission = (permission: Permission): string[] => {
  return DEFAULT_ROLE_CONFIGS
    .filter(role => getAllPermissionsForRole(role.name).includes(permission))
    .map(role => role.name);
};
