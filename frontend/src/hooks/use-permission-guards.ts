import { usePermissions } from './use-permissions';

/**
 * 특정 권한/역할 체크를 위한 편의 훅들
 */

// 역할 기반 체크 훅들
export const useIsAdmin = () => {
  const { role } = usePermissions();
  return role === 'admin';
};

export const useIsManager = () => {
  const { hasRole } = usePermissions();
  return hasRole(['admin', 'manager']);
};

export const useIsDeveloper = () => {
  const { hasRole } = usePermissions();
  return hasRole(['admin', 'manager', 'developer']);
};

// 기능별 권한 체크 훅들
export const useCanManageUsers = () => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(['users.create', 'users.update', 'users.delete', 'users.manage_roles']);
};

export const useCanManageProjects = () => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(['projects.create', 'projects.update', 'projects.delete', 'projects.manage_members']);
};

export const useCanManageTasks = () => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(['tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign', 'tasks.manage_all']);
};

export const useCanViewReports = () => {
  const { hasPermission } = usePermissions();
  return hasPermission('reports.view');
};

export const useCanCreateReports = () => {
  const { hasPermission } = usePermissions();
  return hasPermission('reports.create');
};

export const useCanExportData = () => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(['reports.export', 'admin.export_data']);
};

export const useCanAccessAdmin = () => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission([
    'admin.system_settings',
    'admin.user_management',
    'admin.view_logs',
    'admin.export_data',
    'admin.manage_integrations'
  ]);
};

// 특정 작업 권한 체크
export const useCanEditProject = () => {
  const { hasPermission } = usePermissions();
  return hasPermission('projects.update');
};

export const useCanDeleteTask = () => {
  const { hasPermission } = usePermissions();
  return hasPermission('tasks.delete');
};
