export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectMemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type SortOrder = 'asc' | 'desc';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date?: string;
  budget?: number;
  created_at: string;
  updated_at: string;
  owner: {
    id: number;
    username: string;
    full_name: string;
  };
  members?: ProjectMember[];
  tasks?: Task[];
  comments?: ProjectComment[];
  attachments?: ProjectAttachment[];
  tags?: string[];
  member_count?: number;
  task_count?: number;
  completed_task_count?: number;
  completion_rate?: number;
  is_archived?: boolean;
}

export interface ProjectMember {
  id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  role: ProjectMemberRole;
  joined_at: string;
  is_active: boolean;
  permissions?: string[];
}

export interface ProjectComment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    full_name: string;
    avatar_url?: string;
  };
  is_edited?: boolean;
  mentions?: Array<{
    id: number;
    username: string;
  }>;
}

export interface ProjectAttachment {
  id: number;
  file_name: string;
  file_size: number;
  file_path: string;
  mime_type: string;
  uploaded_at: string;
  uploader: {
    id: number;
    full_name: string;
  };
  download_url?: string;
  thumbnail_url?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
  updated_at: string;
  assignees: Array<{
    id: number;
    full_name: string;
    avatar_url?: string;
  }>;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
}

// Request/Response types
export interface ProjectCreateRequest {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date?: string;
  budget?: number;
  tags?: string[];
  member_ids?: number[];
  template_id?: number;
}

export interface ProjectUpdateRequest extends Partial<ProjectCreateRequest> {
  id: number;
}

export interface ProjectSearchParams {
  search?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  owner_id?: number;
  member_id?: number;
  tags?: string[];
  start_date?: string;
  end_date?: string;
  is_archived?: boolean;
  page_no?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: SortOrder;
}

export interface ProjectListResponse {
  projects: Project[];
  total_items: number;
  page_no: number;
  page_size: number;
  total_pages: number;
}

export interface ProjectStatsResponse {
  total_projects: number;
  by_status: Record<ProjectStatus, number>;
  by_priority: Record<ProjectPriority, number>;
  completion_rate: number;
  average_duration: number;
  budget_utilization?: number;
  overdue_projects: number;
}

export interface CommentCreateRequest {
  content: string;
  mentions?: number[];
}

export interface CommentUpdateRequest {
  content: string;
  mentions?: number[];
}

export interface MemberAddRequest {
  user_id: number;
  role: ProjectMemberRole;
}

export interface MemberUpdateRequest {
  role: ProjectMemberRole;
}

export interface FileUploadResponse {
  id: number;
  file_name: string;
  file_size: number;
  file_path: string;
  url: string;
  thumbnail_url?: string;
}

export interface ProjectDuplicateOptions {
  include_members?: boolean;
  include_tasks?: boolean;
  include_attachments?: boolean;
  include_comments?: boolean;
  new_name?: string;
}

export interface BulkProjectUpdateRequest {
  ids: number[];
  updates: Partial<ProjectCreateRequest>;
}

export interface BulkProjectDeleteRequest {
  ids: number[];
}

export interface ProjectActivityLog {
  id: number;
  action: string;
  description: string;
  user: {
    id: number;
    full_name: string;
  };
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ProjectTemplate {
  id: number;
  name: string;
  description: string;
  default_status: ProjectStatus;
  default_priority: ProjectPriority;
  default_members?: ProjectMemberRole[];
  default_tasks?: Partial<Task>[];
  created_at: string;
}
