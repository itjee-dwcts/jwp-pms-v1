// ============================================================================
// Base Types
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User extends BaseEntity {
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  role: string;
}

export interface Role extends BaseEntity {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission extends BaseEntity {
  name: string;
  description: string;
  resource: string;
  action: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// Project Types
// ============================================================================

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Project extends BaseEntity {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  progress: number;
  budget?: number;
  owner: User;
  members: ProjectMember[];
  tasks: Task[];
  comments: Comment[];
  attachments: Attachment[];
  tags: string[];
}

export interface ProjectMember extends BaseEntity {
  user: User;
  project: Project;
  role: string;
  joinedAt: string;
  permissions: string[];
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  budget?: number;
  memberIds?: string[];
  tags?: string[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}

// ============================================================================
// Task Types
// ============================================================================

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export interface Task extends BaseEntity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  project: Project;
  assignees: User[];
  reporter: User;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  comments: Comment[];
  attachments: Attachment[];
  tags: string[];
  dependencies: Task[];
  subtasks: Task[];
  parent?: Task;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  assigneeIds?: string[];
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  parentId?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment extends BaseEntity {
  content: string;
  author: User;
  projectId?: string;
  taskId?: string;
  parentId?: string;
  replies?: Comment[];
  attachments: Attachment[];
  mentions: User[];
}

export interface CreateCommentRequest {
  content: string;
  projectId?: string;
  taskId?: string;
  parentId?: string;
  mentionIds?: string[];
}

// ============================================================================
// Attachment Types
// ============================================================================

export interface Attachment extends BaseEntity {
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedBy: User;
  projectId?: string;
  taskId?: string;
  commentId?: string;
}

export interface UploadAttachmentRequest {
  file: File;
  projectId?: string;
  taskId?: string;
  commentId?: string;
}

// ============================================================================
// Calendar/Event Types
// ============================================================================

export enum EventType {
  MEETING = 'meeting',
  DEADLINE = 'deadline',
  MILESTONE = 'milestone',
  REMINDER = 'reminder',
  OTHER = 'other',
}

export interface CalendarEvent extends BaseEntity {
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location?: string;
  attendees: User[];
  organizer: User;
  projectId?: string;
  taskId?: string;
  color?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  location?: string;
  attendeeIds?: string[];
  projectId?: string;
  taskId?: string;
  color?: string;
}

// ============================================================================
// Activity Log Types
// ============================================================================

export enum ActivityType {
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_ASSIGNED = 'task_assigned',
  TASK_UNASSIGNED = 'task_unassigned',
  COMMENT_ADDED = 'comment_added',
  COMMENT_UPDATED = 'comment_updated',
  COMMENT_DELETED = 'comment_deleted',
  FILE_UPLOADED = 'file_uploaded',
  FILE_DELETED = 'file_deleted',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
}

export interface ActivityLog extends BaseEntity {
  type: ActivityType;
  description: string;
  user: User;
  projectId?: string;
  taskId?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  myTasks: number;
  upcomingDeadlines: Task[];
  recentActivity: ActivityLog[];
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  dueDate?: string;
}

export interface TaskDistribution {
  status: TaskStatus;
  count: number;
  percentage: number;
}

// ============================================================================
// Filter and Search Types
// ============================================================================

export interface ProjectFilters {
  status?: ProjectStatus[];
  priority?: Priority[];
  ownerId?: string;
  memberIds?: string[];
  tags?: string[];
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  search?: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  projectIds?: string[];
  assigneeIds?: string[];
  reporterId?: string;
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationParams {
  page_no: number;
  page_size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total_items: number;
  page_no: number;
  page_size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: FormFieldError[];
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

// ============================================================================
// Notification Types
// ============================================================================

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface Notification extends BaseEntity {
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  userIds: string[];
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Theme Types
// ============================================================================

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'sm' | 'md' | 'lg';
  density: 'compact' | 'comfortable' | 'spacious';
}

// ============================================================================
// Settings Types
// ============================================================================

export interface UserSettings {
  theme: ThemeConfig;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    taskAssigned: boolean;
    taskCompleted: boolean;
    projectUpdated: boolean;
    commentMentioned: boolean;
    deadlineReminder: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    weekStartsOn: number;
  };
  dashboard: {
    widgets: string[];
    layout: 'grid' | 'list';
    refreshInterval: number;
  };
}

export interface UpdateUserSettingsRequest extends Partial<UserSettings> {}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileUploadConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxFiles: number;
}

// ============================================================================
// Chart/Analytics Types
// ============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  category?: string;
}

export interface ProjectAnalytics {
  projectId: string;
  projectName: string;
  completionRate: number;
  taskDistribution: ChartDataPoint[];
  progressOverTime: TimeSeriesDataPoint[];
  teamProductivity: {
    userId: string;
    userName: string;
    tasksCompleted: number;
    hoursLogged: number;
  }[];
  burndownChart: {
    date: string;
    remainingTasks: number;
    idealTasks: number;
  }[];
}

// ============================================================================
// Gantt Chart Types
// ============================================================================

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string[];
  assignee?: User;
  project: Project;
  color?: string;
  type: 'task' | 'milestone' | 'project';
}

export interface GanttChartConfig {
  viewMode: 'day' | 'week' | 'month' | 'quarter' | 'year';
  showCriticalPath: boolean;
  showDependencies: boolean;
  showMilestones: boolean;
  zoom: number;
}

// ============================================================================
// Drag and Drop Types
// ============================================================================

export interface DragItem {
  id: string;
  type: string;
  data: any;
}

export interface DropResult {
  destination?: {
    droppableId: string;
    index: number;
  };
  source: {
    droppableId: string;
    index: number;
  };
  draggableId: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  children: React.ReactNode;
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
  hoverable?: boolean;
}

// ============================================================================
// Store Types (for State Management)
// ============================================================================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ThemeState {
  isDarkMode: boolean;
  primaryColor: string;
  fontSize: 'sm' | 'md' | 'lg';
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface UIState {
  sidebarOpen: boolean;
  notifications: Notification[];
  modals: {
    [key: string]: boolean;
  };
  loading: {
    [key: string]: boolean;
  };
}

// ============================================================================
// Route Types
// ============================================================================

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
  title?: string;
  breadcrumb?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// ============================================================================
// Environment Types
// ============================================================================

export interface EnvironmentConfig {
  TOKEN_STORAGE_KEY: string;
  REFRESH_TOKEN_STORAGE_KEY: string;
  TOKEN_REFRESH_THRESHOLD: number;
  API_BASE_URL: string;
  GRAPHQL_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  ENABLE_DARK_MODE: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_CALENDAR: boolean;
  ENABLE_GANTT_CHART: boolean;
  GOOGLE_CLIENT_ID?: string;
  GITHUB_CLIENT_ID?: string;
  SENTRY_DSN?: string;
  DEBUG_MODE: boolean;
}
