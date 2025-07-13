import { apiClient } from '../services/api-client';
import {
  PasswordChangeRequest,
  User,
  UserActivityLog,
  UserPreferences,
  UserSession,
  UserStats
} from '../types/auth';
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
} from '../types/user';
import { buildQueryParams } from '../utils/query-params';

export class UserService {
  private readonly baseUrl = '/api/v1/users';

  // CRUD Operations
  async getUsers(params?: UserSearchParams): Promise<User[]> {
    const queryString = params ? buildQueryParams(params) : '';
    const response = await apiClient.request<UserListResponse>(
      `${this.baseUrl}${queryString ? `?${queryString}` : ''}`
    );
    return response.users;
  }

  async getUser(id: string): Promise<User> {
    return apiClient.request<User>(`${this.baseUrl}/${id}`);
  }

  async createUser(data: UserCreateRequest): Promise<User> {
    return apiClient.request<User>(`${this.baseUrl}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: UserUpdateRequest): Promise<User> {
    return apiClient.request<User>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getUserStats(id?: string): Promise<UserStatsResponse | UserStats> {
    const endpoint = id ? `${this.baseUrl}/${id}/stats` : `${this.baseUrl}/stats`;
    return apiClient.request<UserStatsResponse | UserStats>(endpoint);
  }

  // Preferences
  async getUserPreferences(id: string): Promise<UserPreferences> {
    return apiClient.request<UserPreferences>(`${this.baseUrl}/${id}/preferences`);
  }

  async updateUserPreferences(
    id: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    return apiClient.request<UserPreferences>(`${this.baseUrl}/${id}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Activity and Sessions
  async getUserActivity(id: string, params?: UserActivityParams): Promise<UserActivityLog[]> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<UserActivityLog[]>(
      `${this.baseUrl}/${id}/activity${queryString ? `?${queryString}` : ''}`
    );
  }

  async getUserSessions(id: string): Promise<UserSession[]> {
    return apiClient.request<UserSession[]>(`${this.baseUrl}/${id}/sessions`);
  }

  async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${userId}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async revokeAllUserSessions(id: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${id}/sessions`, {
      method: 'DELETE',
    });
  }

  // Avatar Management
  async uploadAvatar(id: string, file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    // Direct fetch for file upload
    const response = await fetch(`${this.baseUrl}/${id}/avatar`, {
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

  async deleteAvatar(id: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${id}/avatar`, {
      method: 'DELETE',
    });
  }

  // Password Management
  async changeUserPassword(id: string, data: PasswordChangeRequest): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${id}/change-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetUserPassword(id: string): Promise<{ temporary_password: string }> {
    return apiClient.request<{ temporary_password: string }>(`${this.baseUrl}/${id}/reset-password`, {
      method: 'POST',
    });
  }

  // User Invitations
  async inviteUser(data: UserInviteRequest): Promise<UserInviteResponse> {
    return apiClient.request<UserInviteResponse>(`${this.baseUrl}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvitations(): Promise<UserInviteResponse[]> {
    return apiClient.request<UserInviteResponse[]>(`${this.baseUrl}/invitations`);
  }

  async resendInvitation(inviteId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/invitations/${inviteId}/resend`, {
      method: 'POST',
    });
  }

  async cancelInvitation(inviteId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/invitations/${inviteId}`, {
      method: 'DELETE',
    });
  }

  // Status Management
  async activateUser(id: string): Promise<User> {
    return apiClient.request<User>(`${this.baseUrl}/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateUser(id: string): Promise<User> {
    return apiClient.request<User>(`${this.baseUrl}/${id}/deactivate`, {
      method: 'POST',
    });
  }

  async suspendUser(id: string, reason?: string): Promise<User> {
    return apiClient.request<User>(`${this.baseUrl}/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unsuspendUser(id: string): Promise<User> {
    return apiClient.request<User>(`${this.baseUrl}/${id}/unsuspend`, {
      method: 'POST',
    });
  }

  // Email Verification
  async sendVerificationEmail(id: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${id}/send-verification`, {
      method: 'POST',
    });
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/verify-email`, {
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
      `${this.baseUrl}/search?${queryString}`
    );
    return response.users;
  }

  // Bulk Operations
  async bulkUpdateUsers(data: BulkUpdateRequest): Promise<User[]> {
    return apiClient.request<User[]>(`${this.baseUrl}/bulk-update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async bulkDeleteUsers(data: BulkDeleteRequest): Promise<void> {
    await apiClient.request(`${this.baseUrl}/bulk-delete`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  async exportUsers(format: ExportFormat, filters?: UserSearchParams): Promise<Blob> {
    const params = { format, ...filters };
    const queryString = buildQueryParams(params);

    const response = await fetch(`${this.baseUrl}/export?${queryString}`, {
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
    return apiClient.request<string[]>(`${this.baseUrl}/roles`);
  }

  async getUserPermissions(id: string): Promise<string[]> {
    return apiClient.request<string[]>(`${this.baseUrl}/${id}/permissions`);
  }

  // User Content
  async getUserProjects(id: string, params?: UserProjectParams): Promise<any[]> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<any[]>(
      `${this.baseUrl}/${id}/projects${queryString ? `?${queryString}` : ''}`
    );
  }

  async getUserTasks(id: string, params?: UserTaskParams): Promise<any[]> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<any[]>(
      `${this.baseUrl}/${id}/tasks${queryString ? `?${queryString}` : ''}`
    );
  }

  // Notifications
  async getUserNotifications(id: string, params?: UserNotificationParams): Promise<any[]> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<any[]>(
      `${this.baseUrl}/${id}/notifications${queryString ? `?${queryString}` : ''}`
    );
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${userId}/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(id: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${id}/notifications/read-all`, {
      method: 'PUT',
    });
  }

  // Team Management
  async getUserTeams(id: string): Promise<any[]> {
    return apiClient.request<any[]>(`${this.baseUrl}/${id}/teams`);
  }

  async addUserToTeam(userId: string, teamId: string, role?: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${userId}/teams/${teamId}`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async removeUserFromTeam(userId: string, teamId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${userId}/teams/${teamId}`, {
      method: 'DELETE',
    });
  }
}

// Singleton instance
export const userService = new UserService();
