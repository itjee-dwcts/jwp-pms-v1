export { PermissionGate } from '@/components/permission-gate';
export { withPermissions } from '@/components/with-permissions';
export { DEFAULT_ROLE_CONFIGS, PERMISSION_GROUPS } from '@/constants/permissions';
export { PermissionsProvider, usePermissionsContext } from '@/contexts/permission-context';
export {
    useCanAccessAdmin, useCanCreateReports, useCanDeleteTask, useCanEditProject, useCanExportData, useCanManageProjects,
    useCanManageTasks, useCanManageUsers, useCanViewReports, useIsAdmin, useIsDeveloper, useIsManager
} from '@/hooks/use-permission-guards';
export { usePermissions } from '@/hooks/use-permissions';
export { permissionService } from '@/services/permission-service';
export type * from '@/types/permission';
