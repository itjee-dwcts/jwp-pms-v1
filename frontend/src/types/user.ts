// ============================================================================
// 사용자 관리 전용 타입 (관리자 기능용)
// 기본 User 타입은 auth.ts에서 import하여 사용
// ============================================================================

import type { User } from './auth';

// ============================================================================
// 사용자 관리 요청/응답 타입
// ============================================================================

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
  is_active?: boolean;
  avatar_url?: string;
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
  page_no: number;
  page_size: number;
  total_pages: number;
  total_items: number;
}

export interface UserStatsResponse {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  by_role: Record<string, number>;
  by_status: Record<string, number>;
  average_projects_per_user: number;
  average_tasks_per_user: number;
}

// ============================================================================
// 사용자 초대 관련 타입
// ============================================================================

export interface UserInviteRequest {
  email: string;
  role: string;
  full_name?: string;
  message?: string;
}

export interface UserInviteResponse {
  id: string;
  email: string;
  role: string;
  invite_token: string;
  expires_at: string;
  created_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  invited_by: string;
  invite_token: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

// ============================================================================
// 파일 업로드 관련 타입
// ============================================================================

export interface AvatarUploadResponse {
  avatar_url: string;
  thumbnail_url?: string;
  file_size: number;
  mime_type: string;
}

// ============================================================================
// 사용자 활동 및 통계 타입
// ============================================================================

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
  project_id?: string;
  page_no?: number;
  page_size?: number;
}

export interface UserNotificationParams {
  read?: boolean;
  type?: string;
  page_no?: number;
  page_size?: number;
}

// ============================================================================
// 대량 작업 타입
// ============================================================================

export interface BulkUpdateRequest {
  user_ids: string[];
  updates: Partial<UserUpdateRequest>;
}

export interface BulkDeleteRequest {
  user_ids: string[];
  force?: boolean;  // 강제 삭제 여부
}

export interface BulkActionResponse {
  success_count: number;
  failed_count: number;
  errors: Array<{
    user_id: string;
    error: string;
  }>;
}

// ============================================================================
// 사용자 필터 및 정렬 타입
// ============================================================================

export interface UserFilter {
  roles?: string[];
  statuses?: string[];
  is_active?: boolean;
  is_verified?: boolean;
  has_avatar?: boolean;
  last_login_days?: number;
  created_days?: number;
  project_count_min?: number;
  project_count_max?: number;
}

export interface UserSort {
  field: 'full_name' | 'email' | 'created_at' | 'last_login_at' | 'project_count';
  direction: 'asc' | 'desc';
}

// ============================================================================
// 사용자 권한 관리 타입
// ============================================================================

export interface UserPermission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface UserRolePermissions {
  role: string;
  permissions: UserPermission[];
}

export interface AssignPermissionRequest {
  user_id: string;
  permission_ids: string[];
}

// ============================================================================
// 사용자 감사 로그 타입
// ============================================================================

export interface UserAuditLog {
  id: string;
  user_id: string;
  admin_id: string;  // 작업을 수행한 관리자 ID
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'invite' | 'role_change';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  reason?: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface UserAuditParams {
  user_id?: string;
  admin_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  page_no?: number;
  page_size?: number;
}

// ============================================================================
// 사용자 내보내기/가져오기 타입
// ============================================================================

export type ExportFormat = 'csv' | 'xlsx' | 'json';

export interface UserExportRequest {
  format: ExportFormat;
  filters?: UserFilter;
  fields?: string[];
  include_stats?: boolean;
}

export interface UserExportResponse {
  download_url: string;
  expires_at: string;
  file_size: number;
  record_count: number;
}

export interface UserImportRequest {
  file: File;
  options: {
    update_existing?: boolean;
    send_invitations?: boolean;
    default_role?: string;
    skip_invalid?: boolean;
  };
}

export interface UserImportResponse {
  import_id: string;
  status: 'processing' | 'completed' | 'failed';
  total_records: number;
  processed_records: number;
  success_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// ============================================================================
// 관리자 대시보드 타입
// ============================================================================

export interface UserDashboardStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
  users_by_role: Record<string, number>;
  users_by_status: Record<string, number>;
  recent_registrations: User[];
  recent_logins: Array<{
    user: User;
    login_time: string;
    ip_address?: string;
  }>;
}

// ============================================================================
// 사용자 프로필 확장 타입
// ============================================================================

export interface ExtendedUser extends User {
  // 관리자만 볼 수 있는 추가 정보
  registration_ip?: string;
  last_login_ip?: string;
  failed_login_attempts: number;
  account_locked_until?: string;
  email_verified_at?: string;
  created_by?: string;  // 초대한 관리자 ID

  // 통계 정보
  total_login_count: number;
  projects_created: number;
  tasks_assigned: number;
  tasks_completed: number;
  comments_count: number;
  files_uploaded: number;
}

// ============================================================================
// 사용자 검색 및 자동완성 타입
// ============================================================================

export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  status: string;
}

export interface UserAutocompleteParams {
  query: string;
  limit?: number;
  exclude_ids?: number[];
  roles?: string[];
  active_only?: boolean;
}

// ============================================================================
// 사용자 관리 훅 타입
// ============================================================================

export interface UseUserManagementReturn {
  // 데이터
  users: User[];
  selectedUsers: User[];
  filters: UserFilter;
  sort: UserSort;
  pagination: {
    page_no: number;
    pageSize: number;
    total_items: number;
    total_pages: number;
  };

  // 상태
  isLoading: boolean;
  error: string | null;

  // 액션
  loadUsers: () => Promise<void>;
  createUser: (data: UserCreateRequest) => Promise<User>;
  updateUser: (id: string, data: UserUpdateRequest) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  bulkUpdate: (data: BulkUpdateRequest) => Promise<BulkActionResponse>;
  bulkDelete: (data: BulkDeleteRequest) => Promise<BulkActionResponse>;

  // 필터링 및 정렬
  setFilters: (filters: Partial<UserFilter>) => void;
  setSort: (sort: UserSort) => void;
  setPagination: (page: number, pageSize: number) => void;

  // 선택 관리
  selectUser: (user: User) => void;
  selectMultipleUsers: (users: User[]) => void;
  clearSelection: () => void;
}
