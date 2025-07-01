import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from './useAuth';

// Permission types
export type Permission =
  // User permissions
  | 'users.read' | 'users.create' | 'users.update' | 'users.delete'
  | 'users.invite' | 'users.manage_roles' | 'users.view_activity'

  // Project permissions
  | 'projects.read' | 'projects.create' | 'projects.update' | 'projects.delete'
  | 'projects.manage_members' | 'projects.view_all' | 'projects.archive'

  // Task permissions
  | 'tasks.read' | 'tasks.create' | 'tasks.update' | 'tasks.delete'
  | 'tasks.assign' | 'tasks.view_all' | 'tasks.manage_all'

  // Calendar permissions
  | 'calendar.read' | 'calendar.create' | 'calendar.update' | 'calendar.delete'
  | 'calendar.manage_all' | 'calendar.view_all'

  // Admin permissions
  | 'admin.system_settings' | 'admin.user_management' | 'admin.view_logs'
  | 'admin.export_data' | 'admin.manage_integrations'

  // Report permissions
  | 'reports.view' | 'reports.create' | 'reports.export' | 'reports.admin'

  // File permissions
  | 'files.upload' | 'files.download' | 'files.delete' | 'files.manage_all';

// Role types
export type Role = 'admin' | 'manager' | 'developer' | 'viewer' | 'guest';

// Permission groups for easier management
export interface PermissionGroup {
  name: string;
  description: string;
  permissions: Permission[];
}

// Role configuration
export interface RoleConfig {
  name: Role;
  displayName: string;
  description: string;
  permissions: Permission[];
  inherits?: Role[];
}

// User permission data
export interface UserPermissions {
  user_id: number;
  role: Role;
  permissions: Permission[];
  granted_permissions: Permission[];
  denied_permissions: Permission[];
  effective_permissions: Permission[];
}

// Resource-specific permissions
export interface ResourcePermissions {
  resource_type: 'project' | 'task' | 'calendar' | 'user';
  resource_id: number;
  permissions: Permission[];
  inherited_permissions: Permission[];
}

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  required_role?: Role;
  required_permissions?: Permission[];
}

// Permission context type
interface PermissionsContextType {
  permissions: Permission[];
  role: Role | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: Permission | Permission[], options?: PermissionCheckOptions) => boolean;
  hasRole: (role: Role | Role[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  checkResourcePermission: (resourceType: string, resourceId: number, permission: Permission) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
  getRoleConfig: (role: Role) => RoleConfig | undefined;
  getPermissionGroups: () => PermissionGroup[];
}

interface PermissionCheckOptions {
  requireAll?: boolean;
  checkResourceLevel?: boolean;
  resourceId?: number;
  resourceType?: string;
}

// Default role configurations
const DEFAULT_ROLE_CONFIGS: RoleConfig[] = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      // All permissions
      'users.read', 'users.create', 'users.update', 'users.delete', 'users.invite', 'users.manage_roles', 'users.view_activity',
      'projects.read', 'projects.create', 'projects.update', 'projects.delete', 'projects.manage_members', 'projects.view_all', 'projects.archive',
      'tasks.read', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign', 'tasks.view_all', 'tasks.manage_all',
      'calendar.read', 'calendar.create', 'calendar.update', 'calendar.delete', 'calendar.manage_all', 'calendar.view_all',
      'admin.system_settings', 'admin.user_management', 'admin.view_logs', 'admin.export_data', 'admin.manage_integrations',
      'reports.view', 'reports.create', 'reports.export', 'reports.admin',
      'files.upload', 'files.download', 'files.delete', 'files.manage_all',
    ],
  },
  {
    name: 'manager',
    displayName: 'Project Manager',
    description: 'Can manage projects and teams',
    permissions: [
      'users.read', 'users.invite', 'users.view_activity',
      'projects.read', 'projects.create', 'projects.update', 'projects.manage_members', 'projects.view_all',
      'tasks.read', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign', 'tasks.view_all',
      'calendar.read', 'calendar.create', 'calendar.update', 'calendar.delete', 'calendar.view_all',
      'reports.view', 'reports.create', 'reports.export',
      'files.upload', 'files.download', 'files.delete',
    ],
  },
  {
    name: 'developer',
    displayName: 'Developer',
    description: 'Can work on assigned projects and tasks',
    permissions: [
      'users.read',
      'projects.read',
      'tasks.read', 'tasks.create', 'tasks.update',
      'calendar.read', 'calendar.create', 'calendar.update',
      'reports.view',
      'files.upload', 'files.download',
    ],
  },
  {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to projects and tasks',
    permissions: [
      'users.read',
      'projects.read',
      'tasks.read',
      'calendar.read',
      'reports.view',
      'files.download',
    ],
  },
  {
    name: 'guest',
    displayName: 'Guest',
    description: 'Limited access to public content',
    permissions: [
      'projects.read',
      'tasks.read',
    ],
  },
];

// Permission groups for UI organization
const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'User Management',
    description: 'Permissions related to user accounts and management',
    permissions: ['users.read', 'users.create', 'users.update', 'users.delete', 'users.invite', 'users.manage_roles', 'users.view_activity'],
  },
  {
    name: 'Project Management',
    description: 'Permissions for project creation and management',
    permissions: ['projects.read', 'projects.create', 'projects.update', 'projects.delete', 'projects.manage_members', 'projects.view_all', 'projects.archive'],
  },
  {
    name: 'Task Management',
    description: 'Permissions for task creation and management',
    permissions: ['tasks.read', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign', 'tasks.view_all', 'tasks.manage_all'],
  },
  {
    name: 'Calendar Management',
    description: 'Permissions for calendar and event management',
    permissions: ['calendar.read', 'calendar.create', 'calendar.update', 'calendar.delete', 'calendar.manage_all', 'calendar.view_all'],
  },
  {
    name: 'System Administration',
    description: 'Administrative permissions for system management',
    permissions: ['admin.system_settings', 'admin.user_management', 'admin.view_logs', 'admin.export_data', 'admin.manage_integrations'],
  },
  {
    name: 'Reports & Analytics',
    description: 'Permissions for viewing and creating reports',
    permissions: ['reports.view', 'reports.create', 'reports.export', 'reports.admin'],
  },
  {
    name: 'File Management',
    description: 'Permissions for file upload and management',
    permissions: ['files.upload', 'files.download', 'files.delete', 'files.manage_all'],
  },
];

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user permissions
  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.request<UserPermissions>(`/users/${user.id}/permissions`);
      setPermissions(response.effective_permissions);
      setRole(response.role);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch permissions';
      setError(errorMessage);
      console.error('Failed to fetch permissions:', err);

      // Fallback to user role if available
      if (user?.role) {
        const roleConfig = DEFAULT_ROLE_CONFIGS.find(config => config.name === user.role);
        if (roleConfig) {
          setPermissions(roleConfig.permissions);
          setRole(user.role as Role);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  // Check if user has specific permission(s)
  const hasPermission = useCallback((
    permission: Permission | Permission[],
    options: PermissionCheckOptions = {}
  ): boolean => {
    if (!isAuthenticated || permissions.length === 0) {
      return false;
    }

    const { requireAll = false } = options;
    const permsToCheck = Array.isArray(permission) ? permission : [permission];

    if (requireAll) {
      return permsToCheck.every(perm => permissions.includes(perm));
    } else {
      return permsToCheck.some(perm => permissions.includes(perm));
    }
  }, [isAuthenticated, permissions]);

  // Check if user has specific role(s)
  const hasRole = useCallback((roleToCheck: Role | Role[]): boolean => {
    if (!isAuthenticated || !role) {
      return false;
    }

    const rolesToCheck = Array.isArray(roleToCheck) ? roleToCheck : [roleToCheck];
    return rolesToCheck.includes(role);
  }, [isAuthenticated, role]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permsToCheck: Permission[]): boolean => {
    return hasPermission(permsToCheck, { requireAll: false });
  }, [hasPermission]);

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permsToCheck: Permission[]): boolean => {
    return hasPermission(permsToCheck, { requireAll: true });
  }, [hasPermission]);

  // Check resource-specific permission
  const checkResourcePermission = useCallback(async (
    resourceType: string,
    resourceId: number,
    permission: Permission
  ): Promise<boolean> => {
    try {
      const response = await apiClient.request<PermissionCheckResult>(
        `/permissions/check/${resourceType}/${resourceId}`,
        {
          method: 'POST',
          body: JSON.stringify({ permission }),
        }
      );
      return response.allowed;
    } catch (error) {
      console.error('Failed to check resource permission:', error);
      return false;
    }
  }, []);

  // Get role configuration
  const getRoleConfig = useCallback((roleToGet: Role): RoleConfig | undefined => {
    return DEFAULT_ROLE_CONFIGS.find(config => config.name === roleToGet);
  }, []);

  // Get permission groups
  const getPermissionGroups = useCallback((): PermissionGroup[] => {
    return PERMISSION_GROUPS;
  }, []);

  // Fetch permissions on mount and when user changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const value: PermissionsContextType = {
    permissions,
    role,
    loading,
    error,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    checkResourcePermission,
    refreshPermissions,
    getRoleConfig,
    getPermissionGroups,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

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

export const useIsAdmin = (): boolean => {
  const { hasRole } = usePermissions();
  return hasRole('admin');
};

export const useIsManager = (): boolean => {
  const { hasRole } = usePermissions();
  return hasRole(['admin', 'manager']);
};

// Higher-order component for permission-based rendering
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[],
  options: {
    requireAll?: boolean;
    fallbackComponent?: React.ComponentType<P>;
    loadingComponent?: React.ComponentType<any>;
  } = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const { hasPermission, loading } = usePermissions();
    const { requireAll = false, fallbackComponent, loadingComponent: LoadingComponent } = options;

    if (loading && LoadingComponent) {
      return <LoadingComponent />;
    }

    const hasRequiredPermissions = hasPermission(requiredPermissions, { requireAll });

    if (!hasRequiredPermissions) {
      if (fallbackComponent) {
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPermissions(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Permission gate component
export const PermissionGate: React.FC<{
  permissions: Permission | Permission[];
  requireAll?: boolean;
  role?: Role | Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permissions, requireAll = false, role, fallback = null, children }) => {
  const { hasPermission, hasRole } = usePermissions();

  const hasRequiredPermissions = hasPermission(permissions, { requireAll });
  const hasRequiredRole = role ? hasRole(role) : true;

  if (hasRequiredPermissions && hasRequiredRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

// Export role configs and permission groups for use in components
export { DEFAULT_ROLE_CONFIGS, PERMISSION_GROUPS };

export default usePermissions;
