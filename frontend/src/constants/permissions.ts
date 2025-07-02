import type { PermissionGroup, RoleConfig } from '@/types/permission';

export const DEFAULT_ROLE_CONFIGS: RoleConfig[] = [
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

export const PERMISSION_GROUPS: PermissionGroup[] = [
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
