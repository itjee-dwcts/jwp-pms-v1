import { DEFAULT_ROLE_CONFIGS, PERMISSION_GROUPS } from '../constants/permissions';
import { apiClient } from '../services/api-client';
import type {
  Permission,
  PermissionCheckResult,
  PermissionGroup,
  Role,
  RoleConfig,
  UserPermissions,
} from '../types/permission';

export class PermissionService {
  private readonly baseUrl = '/api/v1/permissions';

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    return apiClient.request<UserPermissions>(`${this.baseUrl}/users/${userId}/permissions`);
  }

  async checkResourcePermission(
    resourceType: string,
    resourceId: string,
    permission: Permission
  ): Promise<PermissionCheckResult> {
    return apiClient.request<PermissionCheckResult>(
      `${this.baseUrl}/check/${resourceType}/${resourceId}`,
      {
        method: 'POST',
        body: JSON.stringify({ permission }),
      }
    );
  }

  async updateUserPermissions(
    userId: string,
    permissions: Permission[]
  ): Promise<UserPermissions> {
    return apiClient.request<UserPermissions>(`${this.baseUrl}/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  async assignRole(userId: string, role: Role): Promise<UserPermissions> {
    return apiClient.request<UserPermissions>(`${this.baseUrl}/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  getRoleConfig(role: Role): RoleConfig | undefined {
    return DEFAULT_ROLE_CONFIGS.find(config => config.name === role);
  }

  getPermissionGroups(): PermissionGroup[] {
    return PERMISSION_GROUPS;
  }

  getAllRoles(): RoleConfig[] {
    return DEFAULT_ROLE_CONFIGS;
  }

  getPermissionsForRole(role: Role): Permission[] {
    const roleConfig = this.getRoleConfig(role);
    return roleConfig ? roleConfig.permissions : [];
  }

  hasPermissionInRole(role: Role, permission: Permission): boolean {
    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }
}

// Singleton instance
export const permissionService = new PermissionService();
