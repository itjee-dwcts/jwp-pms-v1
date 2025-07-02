export type UserRole = 'admin' | 'manager' | 'developer' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type ThemeType = 'light' | 'dark' | 'system';
export type TimeFormat = '12h' | '24h';
export type ExportFormat = 'csv' | 'xlsx' | 'json';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
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
  theme: ThemeType;
  language: string;
  date_format: string;
  time_format: TimeFormat;
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

// Request/Response types
export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  timezone?: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  full_name?: string;
  role?: string;
  status?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  timezone?: string;
}

export interface UserSearchParams {
  search?: string;
  role?: string;
  status?: string;
  is_verified?: boolean;
  created_after?: string;
  created_before?: string;
  last_login_after?: string;
  last_login_before?: string;
  page_no?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  total_items: number;
  page_no: number;
  page_size: number;
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
  role: string;
  full_name?: string;
  message?: string;
}

export interface UserInviteResponse {
  id: number;
  email: string;
  role: string;
  invite_token: string;
  expires_at: string;
  created_at: string;
}

export interface AvatarUploadResponse {
  avatar_url: string;
  thumbnail_url: string;
}

export interface UserActivityParams {
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
  page_no?: number;
  page_size?: number;
}

export interface UserProjectParams {
  status?: string;
  role?: string;
  page_no?: number;
  page_size?: number;
}

export interface UserTaskParams {
  status?: string;
  priority?: string;
  project_id?: number;
  page_no?: number;
  page_size?: number;
}

export interface UserNotificationParams {
  read?: boolean;
  type?: string;
  page_no?: number;
  page_size?: number;
}

export interface BulkUpdateRequest {
  ids: number[];
  updates: Partial<UserUpdateRequest>;
}

export interface BulkDeleteRequest {
  ids: number[];
}
