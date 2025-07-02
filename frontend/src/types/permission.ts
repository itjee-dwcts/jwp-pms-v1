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

export type Role = 'admin' | 'manager' | 'developer' | 'viewer' | 'guest';

export interface PermissionGroup {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface RoleConfig {
  name: Role;
  displayName: string;
  description: string;
  permissions: Permission[];
  inherits?: Role[];
}

export interface UserPermissions {
  user_id: number;
  role: Role;
  permissions: Permission[];
  granted_permissions: Permission[];
  denied_permissions: Permission[];
  effective_permissions: Permission[];
}

export interface ResourcePermissions {
  resource_type: 'project' | 'task' | 'calendar' | 'user';
  resource_id: number;
  permissions: Permission[];
  inherited_permissions: Permission[];
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  required_role?: Role;
  required_permissions?: Permission[];
}

export interface PermissionCheckOptions {
  requireAll?: boolean;
  checkResourceLevel?: boolean;
  resourceId?: number;
  resourceType?: string;
}

export interface PermissionsState {
  permissions: Permission[];
  role: Role | null;
  loading: boolean;
  error: string | null;
}

export interface PermissionsActions {
  hasPermission: (permission: Permission | Permission[], options?: PermissionCheckOptions) => boolean;
  hasRole: (role: Role | Role[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  checkResourcePermission: (resourceType: string, resourceId: number, permission: Permission) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
  getRoleConfig: (role: Role) => RoleConfig | undefined;
  getPermissionGroups: () => PermissionGroup[];
  clearError: () => void;
}

export type PermissionsContextType = PermissionsState & PermissionsActions;

// Component Props
export interface PermissionGateProps {
  permissions: Permission | Permission[];
  requireAll?: boolean;
  role?: Role | Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export interface WithPermissionsOptions {
  requireAll?: boolean;
  fallbackComponent?: React.ComponentType<any>;
  loadingComponent?: React.ComponentType<any>;
}
