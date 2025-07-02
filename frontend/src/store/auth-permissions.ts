// ============================================================================
// store/auth-permissions.ts - 권한 관리 분리
// ============================================================================

import { User } from '@/types';

export const hasRole = (user: User | null, role: string): boolean => {
  if (!user) return false;
  return user.roles.some(r => r.name === role);
};

export const hasPermission = (user: User | null, resource: string, action: string): boolean => {
  if (!user) return false;
  return user.roles.some(role =>
    role.permissions.some(permission =>
      permission.resource === resource && permission.action === action
    )
  );
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin') || hasRole(user, 'Admin');
};

export const canCreateProject = (user: User | null): boolean => {
  return hasPermission(user, 'project', 'create') || isAdmin(user);
};

export const canEditProject = (user: User | null, projectOwnerId?: string): boolean => {
  if (isAdmin(user)) return true;
  if (hasPermission(user, 'project', 'update')) return true;
  if (user && projectOwnerId && user.id === projectOwnerId) return true;
  return false;
};
