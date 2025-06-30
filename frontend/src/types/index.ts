// src/types/index.ts

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  progress: number;
  owner_id: number;
  owner: User;
  members: User[];
  tasks_count: number;
  completed_tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  member_ids?: number[];
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  progress?: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  project_id: number;
  project: Project;
  assignee_id?: number;
  assignee?: User;
  reporter_id: number;
  reporter: User;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress: number;
  tags: string[];
  attachments: Attachment[];
  comments: Comment[];
  created_at: string;
  updated_at: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  project_id: number;
  assignee_id?: number;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignee_id?: number;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress?: number;
  tags?: string[];
}

export interface Comment {
  id: number;
  content: string;
  task_id?: number;
  project_id?: number;
  user_id: number;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface CommentCreateRequest {
  content: string;
  task_id?: number;
  project_id?: number;
}

export interface Attachment {
  id: number;
  filename: string;
  file_size: number;
  mime_type: string;
  url: string;
  task_id?: number;
  project_id?: number;
  uploaded_by: number;
  uploader: User;
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  type: EventType;
  location?: string;
  attendees: User[];
  task_id?: number;
  task?: Task;
  created_by: number;
  creator: User;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventCreateRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  type?: EventType;
  location?: string;
  attendee_ids?: number[];
  task_id?: number;
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_tasks: number;
  assigned_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  upcoming_deadlines: Task[];
  recent_activities: ActivityLog[];
  project_progress: Array<{
    project: Project;
    completion_rate: number;
  }>;
}

export interface ActivityLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  entity_name: string;
  user_id: number;
  user: User;
  details?: Record<string, any>;
  created_at: string;
}

// 열거형 타입들
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  TESTING = 'testing',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum EventType {
  MEETING = 'meeting',
  DEADLINE = 'deadline',
  MILESTONE = 'milestone',
  REMINDER = 'reminder',
  OTHER = 'other',
}

// API 응답 타입들
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FilterParams {
  search?: string;
  status?: string;
  priority?: string;
  assignee_id?: number;
  project_id?: number;
  start_date?: string;
  end_date?: string;
}

// 폼 타입들
export interface SearchFilters {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  project: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;
}

export interface AppConfig {
  apiBaseUrl: string;
  graphqlEndpoint: string;
  theme: ThemeConfig;
  features: {
    darkMode: boolean;
    notifications: boolean;
    calendar: boolean;
    ganttChart: boolean;
    timeTracking: boolean;
  };
}

// 컴포넌트 Props 타입들
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey: keyof T;
  onRowClick?: (record: T) => void;
}

// 상태 관리 타입들
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  filters: FilterParams;
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}

export interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  filters: FilterParams;
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  loading: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
  }>;
}

// 에러 타입들
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// 유틸리티 타입들
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type ID = string | number;
