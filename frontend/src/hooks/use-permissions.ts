import { DEFAULT_ROLE_CONFIGS } from '@/constants/permissions';
import { useAuth } from '@/hooks/use-auth';
import { permissionService } from '@/services/permission-service';
import type {
  Permission,
  PermissionGroup,
  Role,
  RoleConfig
} from '@/types/permission';
import { useCallback, useEffect } from 'react';
import { usePermissionState } from './use-permission-state';

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const permissionState = usePermissionState();

  // Fetch user permissions
  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      permissionState.setPermissions([]);
      permissionState.setRole(null);
      permissionState.setLoading(false);
      return;
    }

    try {
      permissionState.setLoading(true);
      permissionState.setError(null);

      const response = await permissionService.getUserPermissions(user.id);
      permissionState.setPermissions(response.effective_permissions);
      permissionState.setRole(response.role);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch permissions';
      permissionState.setError(errorMessage);
      console.error('Failed to fetch permissions:', err);

      // Fallback to user role if available
      if (user?.role) {
        const roleConfig = DEFAULT_ROLE_CONFIGS.find(config => config.name === user.role);
        if (roleConfig) {
          permissionState.setPermissions(roleConfig.permissions);
          permissionState.setRole(user.role as Role);
        }
      }
    } finally {
      permissionState.setLoading(false);
    }
  }, [isAuthenticated, user, permissionState]);

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  // Check resource-specific permission
  const checkResourcePermission = useCallback(async (
    resourceType: string,
    resourceId: string,
    permission: Permission
  ): Promise<boolean> => {
    try {
      const response = await permissionService.checkResourcePermission(
        resourceType,
        resourceId,
        permission
      );
      return response.allowed;
    } catch (error) {
      console.error('Failed to check resource permission:', error);
      return false;
    }
  }, []);

  // Get role configuration
  const getRoleConfig = useCallback((role: Role): RoleConfig | undefined => {
    return permissionService.getRoleConfig(role);
  }, []);

  // Get permission groups
  const getPermissionGroups = useCallback((): PermissionGroup[] => {
    return permissionService.getPermissionGroups();
  }, []);

  // Fetch permissions on mount and when user changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    ...permissionState,
    checkResourcePermission,
    refreshPermissions,
    getRoleConfig,
    getPermissionGroups,
  };
};
