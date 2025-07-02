import type {
    Permission,
    PermissionCheckOptions,
    PermissionsState,
    Role,
} from '@/types/permission';
import { useCallback, useState } from 'react';

export const usePermissionState = () => {
  const [state, setState] = useState<PermissionsState>({
    permissions: [],
    role: null,
    loading: true,
    error: null,
  });

  const updateState = useCallback((updates: Partial<PermissionsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setPermissions = useCallback((permissions: Permission[]) => {
    updateState({ permissions });
  }, [updateState]);

  const setRole = useCallback((role: Role | null) => {
    updateState({ role });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Permission checking logic
  const hasPermission = useCallback((
    permission: Permission | Permission[],
    options: PermissionCheckOptions = {}
  ): boolean => {
    if (state.permissions.length === 0) {
      return false;
    }

    const { requireAll = false } = options;
    const permsToCheck = Array.isArray(permission) ? permission : [permission];

    if (requireAll) {
      return permsToCheck.every(perm => state.permissions.includes(perm));
    } else {
      return permsToCheck.some(perm => state.permissions.includes(perm));
    }
  }, [state.permissions]);

  const hasRole = useCallback((roleToCheck: Role | Role[]): boolean => {
    if (!state.role) {
      return false;
    }

    const rolesToCheck = Array.isArray(roleToCheck) ? roleToCheck : [roleToCheck];
    return rolesToCheck.includes(state.role);
  }, [state.role]);

  const hasAnyPermission = useCallback((permsToCheck: Permission[]): boolean => {
    return hasPermission(permsToCheck, { requireAll: false });
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permsToCheck: Permission[]): boolean => {
    return hasPermission(permsToCheck, { requireAll: true });
  }, [hasPermission]);

  return {
    ...state,
    setPermissions,
    setRole,
    setLoading,
    setError,
    clearError,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
  };
};
