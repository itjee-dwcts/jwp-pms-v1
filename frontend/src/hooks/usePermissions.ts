export { usePermissions as default, usePermissions } from './use-permissions';

// 기존 export들 유지 (하위 호환성)
export { PermissionGate } from '@/components/permission-gate';
export { withPermissions } from '@/components/with-permissions';
export { PermissionsProvider } from '@/contexts/permission-context';

// 새로운 특화된 훅들 추가
export {
  useCanManageProjects,
  useCanManageTasks, useCanManageUsers, useIsAdmin,
  useIsManager
} from './use-permission-guards';

// 상수들 re-export
export { DEFAULT_ROLE_CONFIGS, PERMISSION_GROUPS } from '@/constants/permissions';

// 타입들 re-export
export type * from '@/types/permission';
