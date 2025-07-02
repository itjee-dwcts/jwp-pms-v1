import { usePermissions } from './use-permissions';

// Utility hooks for common permission checks
export const useCanManageUsers = (): boolean => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(['users.create', 'users.update', 'users.delete', 'users.manage_roles']);
};

export const useCanManageProjects = (): boolean => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(['projects.create', 'projects.update', 'projects.delete', 'projects.manage_members']);
};

export const useCanManageTasks = (): boolean => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(['tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign']);
};

export const useCanViewReports = (): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission('reports.view');
};

export const useCanCreateReports = (): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission('reports.create');
};

export const useCanExportData = (): boolean => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(['reports.export', 'admin.export_data']);
};

export const useIsAdmin = (): boolean => {
  const { hasRole } = usePermissions();
  return hasRole('admin');
};

export const useIsManager = (): boolean => {
  const { hasRole } = usePermissions();
  return hasRole(['admin', 'manager']);
};

export const useIsDeveloper = (): boolean => {
  const { hasRole } = usePermissions();
  return hasRole(['admin', 'manager', 'developer']);
};

export const useCanAccessAdmin = (): boolean => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission([
    'admin.system_settings',
    'admin.user_management',
    'admin.view_logs',
    'admin.export_data',
    'admin.manage_integrations'
  ]);
};

// Resource-specific permission hooks
export const useCanEditProject = (projectId?: number) => {
  const { hasPermission, checkResourcePermission } = usePermissions();

  const canEditAnyProject = hasPermission('projects.update');

  const checkProjectPermission = async (): Promise<boolean> => {
    if (!projectId) return canEditAnyProject;
    return await checkResourcePermission('project', projectId, 'projects.update');
  };

  return {
    canEditAnyProject,
    checkProjectPermission,
  };
};

export const useCanDeleteTask = (taskId?: number) => {
  const { hasPermission, checkResourcePermission } = usePermissions();

  const canDeleteAnyTask = hasPermission('tasks.delete');

  const checkTaskPermission = async (): Promise<boolean> => {
    if (!taskId) return canDeleteAnyTask;
    return await checkResourcePermission('task', taskId, 'tasks.delete');
  };

  return {
    canDeleteAnyTask,
    checkTaskPermission,
  };
};
