import { useCallback, useState } from 'react';
import { apiClient } from './useAuth';

export type UserRole = 'admin' | 'manager' | 'developer' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  timezone?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  is_verified?: boolean;
  preferences?: UserPreferences;
  stats?: UserStats;
}

export interface UserPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  task_reminders: boolean;
  project_updates: boolean;
  calendar_reminders: boolean;
  weekly_digest: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  date_format: string;
  time_format: '12h' | '24h';
}

export interface UserStats {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  hours_logged: number;
  last_activity: string;
}

export interface UserActivityLog {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface UserSession {
  id: number;
  user_id: number;
  device: string;
  browser: string;
  ip_address: string;
  location?: string;
  is_current: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  timezone?: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  status?: UserStatus;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  timezone?: string;
}

export interface UserSearchParams {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  is_verified?: boolean;
  created_after?: string;
  created_before?: string;
  last_login_after?: string;
  last_login_before?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UserStatsResponse {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  by_role: Record<UserRole, number>;
  by_status: Record<UserStatus, number>;
  average_projects_per_user: number;
  average_tasks_per_user: number;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface UserInviteRequest {
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  message?: string;
}

export interface UserInviteResponse {
  id: number;
  email: string;
  role: UserRole;
  invite_token: string;
  expires_at: string;
  created_at: string;
}

export interface AvatarUploadResponse {
  avatar_url: string;
  thumbnail_url: string;
}

export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await request();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // User CRUD operations
  const getUsers = useCallback(async (params?: UserSearchParams): Promise<User[]> => {
    return handleRequest(async () => {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.request<UserListResponse>(
        `/users?${queryParams.toString()}`
      );
      return response.users;
    });
  }, [handleRequest]);

  const getUser = useCallback(async (id: number): Promise<User> => {
    return handleRequest(async () => {
      return apiClient.request<User>(`/users/${id}`);
    });
  }, [handleRequest]);

  const createUser = useCallback(async (data: UserCreateRequest): Promise<User> => {
    return handleRequest(async () => {
      return apiClient.request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const updateUser = useCallback(async (id: number, data: UserUpdateRequest): Promise<User> => {
    return handleRequest(async () => {
      return apiClient.request<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const deleteUser = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${id}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // User statistics
  const getUserStats = useCallback(async (id?: number): Promise<UserStatsResponse | UserStats> => {
    return handleRequest(async () => {
      const endpoint = id ? `/users/${id}/stats` : '/users/stats';
      return apiClient.request<UserStatsResponse | UserStats>(endpoint);
    });
  }, [handleRequest]);

  // User preferences
  const getUserPreferences = useCallback(async (id: number): Promise<UserPreferences> => {
    return handleRequest(async () => {
      return apiClient.request<UserPreferences>(`/users/${id}/preferences`);
    });
  }, [handleRequest]);

  const updateUserPreferences = useCallback(async (
    id: number,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> => {
    return handleRequest(async () => {
      return apiClient.request<UserPreferences>(`/users/${id}/preferences`, {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    });
  }, [handleRequest]);

  // User activity logs
  const getUserActivity = useCallback(async (
    id: number,
    params?: {
      action?: string;
      resource_type?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<UserActivityLog[]> => {
    return handleRequest(async () => {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      return apiClient.request<UserActivityLog[]>(
        `/users/${id}/activity?${queryParams.toString()}`
      );
    });
  }, [handleRequest]);

  // User sessions
  const getUserSessions = useCallback(async (id: number): Promise<UserSession[]> => {
    return handleRequest(async () => {
      return apiClient.request<UserSession[]>(`/users/${id}/sessions`);
    });
  }, [handleRequest]);

  const revokeUserSession = useCallback(async (userId: number, sessionId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  const revokeAllUserSessions = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${id}/sessions`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Avatar management
  const uploadAvatar = useCallback(async (id: number, file: File): Promise<AvatarUploadResponse> => {
    return handleRequest(async () => {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${apiClient['baseUrl']}/users/${id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pms_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Avatar upload failed');
      }

      return response.json();
    });
  }, [handleRequest]);

  const deleteAvatar = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${id}/avatar`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Password management
  const changeUserPassword = useCallback(async (id: number, data: PasswordChangeRequest): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${id}/change-password`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const resetUserPassword = useCallback(async (id: number): Promise<{ temporary_password: string }> => {
    return handleRequest(async () => {
      return apiClient.request<{ temporary_password: string }>(`/users/${id}/reset-password`, {
        method: 'POST',
      });
    });
  }, [handleRequest]);

  // User invitations
  const inviteUser = useCallback(async (data: UserInviteRequest): Promise<UserInviteResponse> => {
    return handleRequest(async () => {
      return apiClient.request<UserInviteResponse>('/users/invite', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const getInvitations = useCallback(async (): Promise<UserInviteResponse[]> => {
    return handleRequest(async () => {
      return apiClient.request<UserInviteResponse[]>('/users/invitations');
    });
  }, [handleRequest]);

  const resendInvitation = useCallback(async (inviteId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/invitations/${inviteId}/resend`, {
        method: 'POST',
      });
    });
  }, [handleRequest]);

  const cancelInvitation = useCallback(async (inviteId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/invitations/${inviteId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // User status management
  const activateUser = useCallback(async (id: number): Promise<User> => {
    return handleRequest(async () => {
      return apiClient.request<User>(`/users/${id}/activate`, {
        method: 'POST',
      });
    });
  }, [handleRequest]);

  const deactivateUser = useCallback(async (id: number): Promise<User> => {
    return handleRequest(async () => {
      return apiClient.request<User>(`/users/${id}/deactivate`, {
        method: 'POST',
      });
    });
  }, [handleRequest]);

  const suspendUser = useCallback(async (id: number, reason?: string): Promise<User> => {
    return handleRequest(async () => {
      return apiClient.request<User>(`/users/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    });
  }, [handleRequest]);

  const unsuspendUser = useCallback(async (id: number): Promise<User> => {
    return handleRequest(async () => {
      return apiClient.request<User>(`/users/${id}/unsuspend`, {
        method: 'POST',
      });
    });
  }, [handleRequest]);

  // Email verification
  const sendVerificationEmail = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${id}/send-verification`, {
        method: 'POST',
      });
    });
  }, [handleRequest]);

  const verifyEmail = useCallback(async (token: string): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request('/users/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    });
  }, [handleRequest]);

  // User search and filtering
  const searchUsers = useCallback(async (query: string, filters?: {
    role?: UserRole;
    status?: UserStatus;
    limit?: number;
  }): Promise<User[]> => {
    return handleRequest(async () => {
      const params = new URLSearchParams({ search: query });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.request<UserListResponse>(
        `/users/search?${params.toString()}`
      );
      return response.users;
    });
  }, [handleRequest]);

  // Bulk operations
  const bulkUpdateUsers = useCallback(async (
    ids: number[],
    updates: Partial<UserUpdateRequest>
  ): Promise<User[]> => {
    return handleRequest(async () => {
      return apiClient.request<User[]>('/users/bulk-update', {
        method: 'PUT',
        body: JSON.stringify({ ids, updates }),
      });
    });
  }, [handleRequest]);

  const bulkDeleteUsers = useCallback(async (ids: number[]): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request('/users/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      });
    });
  }, [handleRequest]);

  const exportUsers = useCallback(async (
    format: 'csv' | 'xlsx' | 'json',
    filters?: UserSearchParams
  ): Promise<Blob> => {
    return handleRequest(async () => {
      const params = new URLSearchParams({ format });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`${apiClient['baseUrl']}/users/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pms_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return response.blob();
    });
  }, [handleRequest]);

  // User roles and permissions
  const getUserRoles = useCallback(async (): Promise<string[]> => {
    return handleRequest(async () => {
      return apiClient.request<string[]>('/users/roles');
    });
  }, [handleRequest]);

  const getUserPermissions = useCallback(async (id: number): Promise<string[]> => {
    return handleRequest(async () => {
      return apiClient.request<string[]>(`/users/${id}/permissions`);
    });
  }, [handleRequest]);

  // User projects and tasks
  const getUserProjects = useCallback(async (id: number, params?: {
    status?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<any[]> => {
    return handleRequest(async () => {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      return apiClient.request<any[]>(
        `/users/${id}/projects?${queryParams.toString()}`
      );
    });
  }, [handleRequest]);

  const getUserTasks = useCallback(async (id: number, params?: {
    status?: string;
    priority?: string;
    project_id?: number;
    page?: number;
    limit?: number;
  }): Promise<any[]> => {
    return handleRequest(async () => {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      return apiClient.request<any[]>(
        `/users/${id}/tasks?${queryParams.toString()}`
      );
    });
  }, [handleRequest]);

  // User notifications
  const getUserNotifications = useCallback(async (id: number, params?: {
    read?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<any[]> => {
    return handleRequest(async () => {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      return apiClient.request<any[]>(
        `/users/${id}/notifications?${queryParams.toString()}`
      );
    });
  }, [handleRequest]);

  const markNotificationAsRead = useCallback(async (userId: number, notificationId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${userId}/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
    });
  }, [handleRequest]);

  const markAllNotificationsAsRead = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${id}/notifications/read-all`, {
        method: 'PUT',
      });
    });
  }, [handleRequest]);

  // User team assignments
  const getUserTeams = useCallback(async (id: number): Promise<any[]> => {
    return handleRequest(async () => {
      return apiClient.request<any[]>(`/users/${id}/teams`);
    });
  }, [handleRequest]);

  const addUserToTeam = useCallback(async (userId: number, teamId: number, role?: string): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${userId}/teams/${teamId}`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
    });
  }, [handleRequest]);

  const removeUserFromTeam = useCallback(async (userId: number, teamId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/users/${userId}/teams/${teamId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  return {
    // State
    loading,
    error,
    clearError,

    // User CRUD
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,

    // Statistics
    getUserStats,

    // Preferences
    getUserPreferences,
    updateUserPreferences,

    // Activity and sessions
    getUserActivity,
    getUserSessions,
    revokeUserSession,
    revokeAllUserSessions,

    // Avatar management
    uploadAvatar,
    deleteAvatar,

    // Password management
    changeUserPassword,
    resetUserPassword,

    // Invitations
    inviteUser,
    getInvitations,
    resendInvitation,
    cancelInvitation,

    // Status management
    activateUser,
    deactivateUser,
    suspendUser,
    unsuspendUser,

    // Email verification
    sendVerificationEmail,
    verifyEmail,

    // Search and filtering
    searchUsers,

    // Bulk operations
    bulkUpdateUsers,
    bulkDeleteUsers,
    exportUsers,

    // Roles and permissions
    getUserRoles,
    getUserPermissions,

    // User content
    getUserProjects,
    getUserTasks,

    // Notifications
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,

    // Team management
    getUserTeams,
    addUserToTeam,
    removeUserFromTeam,
  };
};

export default useUsers;
