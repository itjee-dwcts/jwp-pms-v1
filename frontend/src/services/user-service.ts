import { apiClient } from '@/services/api-client';
import {
  PasswordChangeRequest,
  User,
  UserActivityLog,
  UserPreferences,
  UserSession,
  UserStats
} from '@/types/auth';
import type {
  AvatarUploadResponse,
  BulkDeleteRequest,
  BulkUpdateRequest,
  ExportFormat,
  UserActivityParams,
  UserCreateRequest,
  UserInviteRequest,
  UserInviteResponse,
  UserListResponse,
  UserNotificationParams,
  UserProjectParams,
  UserSearchParams,
  UserStatsResponse,
  UserTaskParams,
  UserUpdateRequest
} from '@/types/user';
import { buildQueryParams } from '@/utils/query-params';

export class UserService {
  // CRUD Operations
  async getUsers(params?: UserSearchParams): Promise<User[]> {
    const queryString = params ? buildQueryParams(params) : '';
    const response = await apiClient.request<UserListResponse>(
      `/users${queryString ? `?${queryString}` : ''}`
    );
    return response.users;
  }

  async getUser(id: number): Promise<User> {
    return apiClient.request<User>(`/users/${id}`);
  }

  async createUser(data: UserCreateRequest): Promise<User> {
    return apiClient.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: UserUpdateRequest): Promise<User> {
    return apiClient.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await apiClient.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getUserStats(id?: number): Promise<UserStatsResponse | UserStats> {
    const endpoint = id ? `/users/${id}/stats` : '/users/stats';
    return apiClient.request<UserStatsResponse | UserStats>(endpoint);
  }

  // Preferences
  async getUserPreferences(id: number): Promise<UserPreferences> {
    return apiClient.request<UserPreferences>(`/users/${id}/preferences`);
  }

  async updateUserPreferences(
    id: number,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    return apiClient.request<UserPreferences>(`/users/${id}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Activity and Sessions
  async getUserActivity(id: number, params?: UserActivityParams): Promise<UserActivityLog[]> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<UserActivityLog[]>(
      `/users/${id}/activity${queryString ? `?${queryString}` : ''}`
    );
  }

  async getUserSessions(id: number): Promise<UserSession[]> {
    return apiClient.request<UserSession[]>(`/users/${id}/sessions`);
  }

  async revokeUserSession(userId: number, sessionId: number): Promise<void> {
    await apiClient.request(`/users/${userId}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async revokeAllUserSessions(id: number): Promise<void> {
    await apiClient.request(`/users/${id}/sessions`, {
      method: 'DELETE',
    });
  }

  // Avatar Management
  async uploadAvatar(id: number, file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    // Direct fetch for file upload
    const response = await fetch(`${apiClient.baseUrl}/users/${id}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Avatar upload failed');
    }

    return response.json();
  }

  async deleteAvatar(id: number): Promise<void> {
    await apiClient.request(`/users/${id}/avatar`, {
      method: 'DELETE',
    });
  }

  // Password Management
  async changeUserPassword(id: number, data: PasswordChangeRequest): Promise<void> {
    await apiClient.request(`/users/${id}/change-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetUserPassword(id: number): Promise<{ temporary_password: string }> {
    return apiClient.request<{ temporary_password: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
    });
  }

  // User Invitations
  async inviteUser(data: UserInviteRequest): Promise<UserInviteResponse> {
    return apiClient.request<UserInviteResponse>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvitations(): Promise<UserInviteResponse[]> {
    return apiClient.request<UserInviteResponse[]>('/users/invitations');
  }

  async resendInvitation(inviteId: number): Promise<void> {
    await apiClient.request(`/users/invitations/${inviteId}/resend`, {
      method: 'POST',
    });
  }

  async cancelInvitation(inviteId: number): Promise<void> {
    await apiClient.request(`/users/invitations/${inviteId}`, {
      method: 'DELETE',
    });
  }

  // Status Management
  async activateUser(id: number): Promise<User> {
    return apiClient.request<User>(`/users/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateUser(id: number): Promise<User> {
    return apiClient.request<User>(`/users/${id}/deactivate`, {
      method: 'POST',
    });
  }

  async suspendUser(id: number, reason?: string): Promise<User> {
    return apiClient.request<User>(`/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unsuspendUser(id: number): Promise<User> {
    return apiClient.request<User>(`/users/${id}/unsuspend`, {
      method: 'POST',
    });
  }

  // Email Verification
  async sendVerificationEmail(id: number): Promise<void> {
    await apiClient.request(`/users/${id}/send-verification`, {
      method: 'POST',
    });
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.request('/users/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Search and Filtering
  async searchUsers(query: string, filters?: {
    role?: string;
    status?: string;
    page_size?: number;
  }): Promise<User[]> {
    const params = { search: query, ...filters };
    const queryString = buildQueryParams(params);

    const response = await apiClient.request<UserListResponse>(
      `/users/search?${queryString}`
    );
    return response.users;
  }

  // Bulk Operations
  async bulkUpdateUsers(data: BulkUpdateRequest): Promise<User[]> {
    return apiClient.request<User[]>('/users/bulk-update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async bulkDeleteUsers(data: BulkDeleteRequest): Promise<void> {
    await apiClient.request('/users/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  async exportUsers(format: ExportFormat, filters?: UserSearchParams): Promise<Blob> {
    const params = { format, ...filters };
    const queryString = buildQueryParams(params);

    const response = await fetch(`${apiClient.baseUrl}/users/export?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // Roles and Permissions
  async getUserRoles(): Promise<string[]> {
    return apiClient.request<string[]>('/users/roles');
  }

  async getUserPermissions(id: number): Promise<string[]> {
    return apiClient.request<string[]>(`/users/${id}/permissions`);
  }

  // User Content
  async getUserProjects(id: number, params?: UserProjectParams): Promise<any[]> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<any[]>(
      `/users/${id}/projects${queryString ? `?${queryString}` : ''}`
    );
  }

  async getUserTasks(id: number, params?: UserTaskParams): Promise<any[]> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<any[]>(
      `/users/${id}/tasks${queryString ? `?${queryString}` : ''}`
    );
  }

  // Notifications
  async getUserNotifications(id: number, params?: UserNotificationParams): Promise<any[]> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<any[]>(
      `/users/${id}/notifications${queryString ? `?${queryString}` : ''}`
    );
  }

  async markNotificationAsRead(userId: number, notificationId: number): Promise<void> {
    await apiClient.request(`/users/${userId}/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(id: number): Promise<void> {
    await apiClient.request(`/users/${id}/notifications/read-all`, {
      method: 'PUT',
    });
  }

  // Team Management
  async getUserTeams(id: number): Promise<any[]> {
    return apiClient.request<any[]>(`/users/${id}/teams`);
  }

  async addUserToTeam(userId: number, teamId: number, role?: string): Promise<void> {
    await apiClient.request(`/users/${userId}/teams/${teamId}`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    await apiClient.request(`/users/${userId}/teams/${teamId}`, {
      method: 'DELETE',
    });
  }
}

// Singleton instance
export const userService = new UserService();
