export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
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
  id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  role: string;
  joined_at: string;
  is_active: boolean;
  permissions?: string[];
}

export interface ProjectComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  is_edited?: boolean;
  mentions?: Array<{
    id: string;
    username: string;
  }>;
}

export interface ProjectAttachment {
  id: string;
  file_name: string;
  file_size: number;
  file_path: string;
  mime_type: string;
  uploaded_at: string;
  uploader: {
    id: string;
    full_name: string;
  };
  download_url?: string;
  thumbnail_url?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  assignees: Array<{
    id: string;
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
  status: string;
  priority: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  tags?: string[];
  member_ids?: string[];
  template_id?: string;
}

export interface ProjectUpdateRequest extends Partial<ProjectCreateRequest> {
  id: string;
}

export interface ProjectSearchParams {
  search?: string;
  status?: string;
  priority?: string;
  owner_id?: string;
  member_id?: string;
  tags?: string[];
  start_date?: string;
  end_date?: string;
  is_archived?: boolean;
  page_no?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface ProjectListResponse {
  projects: Project[];
  page_no: number;
  page_size: number;
  total_pages: number;
  total_items: number;
}

export interface ProjectStatsResponse {
  total_projects: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  completion_rate: number;
  average_duration: number;
  budget_utilization?: number;
  overdue_projects: number;
}

export interface CommentCreateRequest {
  content: string;
  mentions?: string[];
}

export interface CommentUpdateRequest {
  content: string;
  mentions?: string[];
}

export interface MemberAddRequest {
  user_id: string;
  role: string;
}

export interface MemberUpdateRequest {
  role: string;
}

export interface FileUploadResponse {
  id: string;
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
  ids: string[];
  updates: Partial<ProjectCreateRequest>;
}

export interface BulkProjectDeleteRequest {
  ids: string[];
}

export interface ProjectActivityLog {
  id: string;
  action: string;
  description: string;
  user: {
    id: string;
    full_name: string;
  };
  created_at: string;
  extra_data?: Record<string, any>;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  default_status: string;
  default_priority: string;
  default_members?: string[];
  default_tasks?: Partial<Task>[];
  created_at: string;
}
