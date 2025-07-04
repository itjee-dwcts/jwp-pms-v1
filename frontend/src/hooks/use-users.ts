import { userService } from '@/services/user-service';
import { PasswordChangeRequest, User, UserActivityLog, UserPreferences, UserSession, UserStats } from '@/types/auth';
import type {
  AvatarUploadResponse,
  BulkDeleteRequest,
  BulkUpdateRequest,
  ExportFormat,
  UserActivityParams,
  UserCreateRequest,
  UserInviteRequest,
  UserInviteResponse,
  UserNotificationParams,
  UserProjectParams,
  UserSearchParams,
  UserStatsResponse,
  UserTaskParams,
  UserUpdateRequest
} from '@/types/user';
import { useCallback } from 'react';
import { useUserState } from './use-user-state';

export const useUsers = () => {
  const userState = useUserState();

  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<T> => {
    userState.setLoading(true);
    userState.setError(null);
    try {
      const result = await request();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      userState.setError(errorMessage);
      throw err;
    } finally {
      userState.setLoading(false);
    }
  }, [userState]);

  // CRUD Operations
  const getUsers = useCallback(async (params?: UserSearchParams): Promise<User[]> => {
    return handleRequest(async () => {
      const users = await userService.getUsers(params);
      userState.setUsers(users);
      return users;
    });
  }, [handleRequest, userState]);

  const getUser = useCallback(async (id: number): Promise<User> => {
    return handleRequest(async () => {
      const user = await userService.getUser(id);
      userState.setCurrentUser(user);
      return user;
    });
  }, [handleRequest, userState]);

  const createUser = useCallback(async (data: UserCreateRequest): Promise<User> => {
    return handleRequest(async () => {
      const user = await userService.createUser(data);
      userState.addUser(user);
      return user;
    });
  }, [handleRequest, userState]);

  const updateUser = useCallback(async (id: number, data: UserUpdateRequest): Promise<User> => {
    return handleRequest(async () => {
      const user = await userService.updateUser(id, data);
      userState.updateUserInList(id, user);
      if (userState.currentUser?.id === id) {
        userState.setCurrentUser(user);
      }
      return user;
    });
  }, [handleRequest, userState]);

  const deleteUser = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await userService.deleteUser(id);
      userState.removeUser(id);
      if (userState.currentUser?.id === id) {
        userState.setCurrentUser(null);
      }
    });
  }, [handleRequest, userState]);

  // Statistics
  const getUserStats = useCallback(async (id?: number): Promise<UserStatsResponse | UserStats> => {
    return handleRequest(() => userService.getUserStats(id));
  }, [handleRequest]);

  // Preferences
  const getUserPreferences = useCallback(async (id: number): Promise<UserPreferences> => {
    return handleRequest(() => userService.getUserPreferences(id));
  }, [handleRequest]);

  const updateUserPreferences = useCallback(async (
    id: number,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> => {
    return handleRequest(() => userService.updateUserPreferences(id, preferences));
  }, [handleRequest]);

  // Activity and Sessions
  const getUserActivity = useCallback(async (
    id: number,
    params?: UserActivityParams
  ): Promise<UserActivityLog[]> => {
    return handleRequest(() => userService.getUserActivity(id, params));
  }, [handleRequest]);

  const getUserSessions = useCallback(async (id: number): Promise<UserSession[]> => {
    return handleRequest(() => userService.getUserSessions(id));
  }, [handleRequest]);

  const revokeUserSession = useCallback(async (userId: number, sessionId: number): Promise<void> => {
    return handleRequest(() => userService.revokeUserSession(userId, sessionId));
  }, [handleRequest]);

  const revokeAllUserSessions = useCallback(async (id: number): Promise<void> => {
    return handleRequest(() => userService.revokeAllUserSessions(id));
  }, [handleRequest]);

  // Avatar Management
  const uploadAvatar = useCallback(async (id: number, file: File): Promise<AvatarUploadResponse> => {
    return handleRequest(async () => {
      const result = await userService.uploadAvatar(id, file);
      // Update user avatar in state
      userState.updateUserInList(id, { avatar_url: result.avatar_url });
      if (userState.currentUser?.id === id) {
        userState.setCurrentUser({
          ...userState.currentUser,
          avatar_url: result.avatar_url,
        });
      }
      return result;
    });
  }, [handleRequest, userState]);

  const deleteAvatar = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await userService.deleteAvatar(id);
      // Remove avatar from state
      userState.updateUserInList(id, {});
      if (userState.currentUser?.id === id) {
        const { avatar_url, ...rest } = userState.currentUser || {};
        userState.setCurrentUser({
          ...rest,
        });
      }
    });
  }, [handleRequest, userState]);

  // Password Management
  const changeUserPassword = useCallback(async (id: number, data: PasswordChangeRequest): Promise<void> => {
    return handleRequest(() => userService.changeUserPassword(id, data));
  }, [handleRequest]);

  const resetUserPassword = useCallback(async (id: number): Promise<{ temporary_password: string }> => {
    return handleRequest(() => userService.resetUserPassword(id));
  }, [handleRequest]);

  // User Invitations
  const inviteUser = useCallback(async (data: UserInviteRequest): Promise<UserInviteResponse> => {
    return handleRequest(() => userService.inviteUser(data));
  }, [handleRequest]);

  const getInvitations = useCallback(async (): Promise<UserInviteResponse[]> => {
    return handleRequest(() => userService.getInvitations());
  }, [handleRequest]);

  const resendInvitation = useCallback(async (inviteId: number): Promise<void> => {
    return handleRequest(() => userService.resendInvitation(inviteId));
  }, [handleRequest]);

  const cancelInvitation = useCallback(async (inviteId: number): Promise<void> => {
    return handleRequest(() => userService.cancelInvitation(inviteId));
  }, [handleRequest]);

  // Status Management
  const activateUser = useCallback(async (id: number): Promise<User> => {
    return handleRequest(async () => {
      const user = await userService.activateUser(id);
      userState.updateUserInList(id, user);
      return user;
    });
  }, [handleRequest, userState]);

  const deactivateUser = useCallback(async (id: number): Promise<User> => {
    return handleRequest(async () => {
      const user = await userService.deactivateUser(id);
      userState.updateUserInList(id, user);
      return user;
    });
  }, [handleRequest, userState]);

  const suspendUser = useCallback(async (id: number, reason?: string): Promise<User> => {
    return handleRequest(async () => {
      const user = await userService.suspendUser(id, reason);
      userState.updateUserInList(id, user);
      return user;
    });
  }, [handleRequest, userState]);

  const unsuspendUser = useCallback(async (id: number): Promise<User> => {
    return handleRequest(async () => {
      const user = await userService.unsuspendUser(id);
      userState.updateUserInList(id, user);
      return user;
    });
  }, [handleRequest, userState]);

  // Email Verification
  const sendVerificationEmail = useCallback(async (id: number): Promise<void> => {
    return handleRequest(() => userService.sendVerificationEmail(id));
  }, [handleRequest]);

  const verifyEmail = useCallback(async (token: string): Promise<void> => {
    return handleRequest(() => userService.verifyEmail(token));
  }, [handleRequest]);

  // Search and Filtering
  const searchUsers = useCallback(async (query: string, filters?: {
    role?: string;
    status?: string;
    page_size?: number;
  }): Promise<User[]> => {
    return handleRequest(async () => {
      const users = await userService.searchUsers(query, filters);
      userState.setUsers(users);
      return users;
    });
  }, [handleRequest, userState]);

  // Bulk Operations
  const bulkUpdateUsers = useCallback(async (data: BulkUpdateRequest): Promise<User[]> => {
    return handleRequest(async () => {
      const users = await userService.bulkUpdateUsers(data);
      // Update users in state
      users.forEach(user => {
        userState.updateUserInList(user.id, user);
      });
      return users;
    });
  }, [handleRequest, userState]);

  const bulkDeleteUsers = useCallback(async (data: BulkDeleteRequest): Promise<void> => {
    return handleRequest(async () => {
      await userService.bulkDeleteUsers(data);
      // Remove users from state
      data.user_ids.forEach(id => {
        userState.removeUser(id);
      });
    });
  }, [handleRequest, userState]);

  const exportUsers = useCallback(async (
    format: ExportFormat,
    filters?: UserSearchParams
  ): Promise<Blob> => {
    return handleRequest(() => userService.exportUsers(format, filters));
  }, [handleRequest]);

  // Roles and Permissions
  const getUserRoles = useCallback(async (): Promise<string[]> => {
    return handleRequest(() => userService.getUserRoles());
  }, [handleRequest]);

  const getUserPermissions = useCallback(async (id: number): Promise<string[]> => {
    return handleRequest(() => userService.getUserPermissions(id));
  }, [handleRequest]);

  // User Content
  const getUserProjects = useCallback(async (id: number, params?: UserProjectParams): Promise<any[]> => {
    return handleRequest(() => userService.getUserProjects(id, params));
  }, [handleRequest]);

  const getUserTasks = useCallback(async (id: number, params?: UserTaskParams): Promise<any[]> => {
    return handleRequest(() => userService.getUserTasks(id, params));
  }, [handleRequest]);

  // Notifications
  const getUserNotifications = useCallback(async (id: number, params?: UserNotificationParams): Promise<any[]> => {
    return handleRequest(() => userService.getUserNotifications(id, params));
  }, [handleRequest]);

  const markNotificationAsRead = useCallback(async (userId: number, notificationId: number): Promise<void> => {
    return handleRequest(() => userService.markNotificationAsRead(userId, notificationId));
  }, [handleRequest]);

  const markAllNotificationsAsRead = useCallback(async (id: number): Promise<void> => {
    return handleRequest(() => userService.markAllNotificationsAsRead(id));
  }, [handleRequest]);

  // Team Management
  const getUserTeams = useCallback(async (id: number): Promise<any[]> => {
    return handleRequest(() => userService.getUserTeams(id));
  }, [handleRequest]);

  const addUserToTeam = useCallback(async (userId: number, teamId: number, role?: string): Promise<void> => {
    return handleRequest(() => userService.addUserToTeam(userId, teamId, role));
  }, [handleRequest]);

  const removeUserFromTeam = useCallback(async (userId: number, teamId: number): Promise<void> => {
    return handleRequest(() => userService.removeUserFromTeam(userId, teamId));
  }, [handleRequest]);

  return {
    // State
    ...userState,

    // CRUD Operations
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

    // Activity and Sessions
    getUserActivity,
    getUserSessions,
    revokeUserSession,
    revokeAllUserSessions,

    // Avatar Management
    uploadAvatar,
    deleteAvatar,

    // Password Management
    changeUserPassword,
    resetUserPassword,

    // User Invitations
    inviteUser,
    getInvitations,
    resendInvitation,
    cancelInvitation,

    // Status Management
    activateUser,
    deactivateUser,
    suspendUser,
    unsuspendUser,

    // Email Verification
    sendVerificationEmail,
    verifyEmail,

    // Search and Filtering
    searchUsers,

    // Bulk Operations
    bulkUpdateUsers,
    bulkDeleteUsers,
    exportUsers,

    // Roles and Permissions
    getUserRoles,
    getUserPermissions,

    // User Content
    getUserProjects,
    getUserTasks,

    // Notifications
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,

    // Team Management
    getUserTeams,
    addUserToTeam,
    removeUserFromTeam,
  };
};
