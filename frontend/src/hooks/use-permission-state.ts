import type { Permission, PermissionsState, Role } from '@/types/permission';
import { useCallback, useState } from 'react';

/**
 * 권한 상태 관리를 위한 내부 훅
 */
export const usePermissionState = (): PermissionsState & {
  setPermissions: (permissions: Permission[]) => void;
  setRole: (role: Role | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hasPermission: (permission: Permission | Permission[], options?: { requireAll?: boolean }) => boolean;
  hasRole: (role: Role | Role[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  clearError: () => void;
} => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 단일 또는 다중 권한 체크
  const hasPermission = useCallback((
    permission: Permission | Permission[],
    options: { requireAll?: boolean } = {}
  ): boolean => {
    const { requireAll = true } = options;

    if (Array.isArray(permission)) {
      return requireAll
        ? permission.every(p => permissions.includes(p))
        : permission.some(p => permissions.includes(p));
    }

    return permissions.includes(permission);
  }, [permissions]);

  // 역할 체크
  const hasRole = useCallback((roleToCheck: Role | Role[]): boolean => {
    if (!role) return false;

    if (Array.isArray(roleToCheck)) {
      return roleToCheck.includes(role);
    }

    return role === roleToCheck;
  }, [role]);

  // 하나 이상의 권한 보유 체크
  const hasAnyPermission = useCallback((permissionsToCheck: Permission[]): boolean => {
    return permissionsToCheck.some(p => permissions.includes(p));
  }, [permissions]);

  // 모든 권한 보유 체크
  const hasAllPermissions = useCallback((permissionsToCheck: Permission[]): boolean => {
    return permissionsToCheck.every(p => permissions.includes(p));
  }, [permissions]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    permissions,
    role,
    loading,
    error,
    setPermissions,
    setRole,
    setLoading,
    setError,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    clearError,
  };
};
