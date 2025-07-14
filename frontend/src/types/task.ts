export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  start_date?: string;
  end_date?: string;
  estimated_days?: number;
  actual_days?: number;
  created_at: string;
  updated_at: string;
  project: {
    id: string;
    name: string;
  };
  assignees: TaskAssignee[];
  creator: {
    id: string;
    username: string;
    full_name: string;
  };
  parent_task?: {
    id: string;
    title: string;
  };
  subtasks?: Task[];
  tags: TaskTag[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  time_logs?: TaskTimeLog[];
  dependencies?: TaskDependency[];
  comments_count: number;
  attachments_count: number;
  subtasks_count: number;
  completion_rate?: number;
  is_overdue?: boolean;
}

export interface TaskAssignee {
  id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  assigned_at: string;
  assigned_by: number;
}

export interface TaskTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  usage_count?: number;
}

export interface TaskComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  parent_id?: string;
  replies?: TaskComment[];
  is_edited?: boolean;
  mentions?: Array<{
    id: string;
    username: string;
  }>;
}

export interface TaskAttachment {
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

export interface TaskTimeLog {
  id: string;
  hours: number;
  description?: string;
  work_date: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
  };
  is_billable?: boolean;
}

export interface TaskDependency {
  id: string;
  dependent_task_id: string;
  dependency_task_id: string;
  dependency_type: string;
  created_at: string;
  dependency_task: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
}

// Request/Response types
export interface TaskCreateRequest {
  title: string;
  description: string;
  project_id: string;
  status?: string;
  priority?: string;
  type?: string;
  due_date?: string;
  estimated_hours?: number;
  parent_task_id?: string;
  assignee_ids?: string[];
  tag_ids?: string[];
  dependency_ids?: string[];
}

export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {
  id: string;
}

export interface TaskSearchParams {
  search?: string;
  project_id?: string;
  assignee_id?: string;
  creator_id?: string;
  status?: string;
  priority?: string;
  type?: string;
  due_before?: string;
  due_after?: string;
  created_before?: string;
  created_after?: string;
  tag_ids?: string[];
  has_due_date?: string;
  is_overdue?: string;
  parent_task_id?: string;
  page_no?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  page_no: number;
  page_size: number;
  total_pages: number;
  total_items: number;
}

export interface TaskStatsResponse {
  total_tasks: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
  completion_rate: number;
  overdue_tasks: number;
  average_completion_time: number;
  tasks_this_week: number;
  tasks_this_month: number;
  total_logged_hours: number;
  average_estimated_vs_actual: number;
}

export interface TaskKanbanBoard {
  columns: TaskKanbanColumn[];
  total_tasks: number;
}

export interface TaskKanbanColumn {
  status: string;
  title: string;
  tasks: Task[];
  task_count: number;
  wip_limit?: number;
}

export interface TaskGanttChart {
  tasks: TaskGanttItem[];
  dependencies: TaskDependency[];
  timeline: {
    start_date: string;
    end_date: string;
  };
}

export interface TaskGanttItem {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
  priority: string;
  assignees: string[];
  parent_id?: string;
  estimated_hours?: number;
  actual_hours?: number;
}

export interface CommentCreateRequest {
  content: string;
  parent_id?: string;
  mentions?: string[];
}

export interface CommentUpdateRequest {
  content: string;
  mentions?: string[];
}

export interface TimeLogCreateRequest {
  hours: number;
  description?: string;
  work_date: string;
  is_billable?: boolean;
}

export interface TimeLogUpdateRequest extends Partial<TimeLogCreateRequest> {
  id: string;
}

export interface AssignTaskRequest {
  user_ids: string[];
}

export interface TagCreateRequest {
  name: string;
  color: string;
}

export interface DependencyCreateRequest {
  dependency_task_id: string;
  dependency_type: string;
}

export interface TaskDuplicateOptions {
  include_assignees?: boolean;
  include_comments?: boolean;
  include_attachments?: boolean;
  include_time_logs?: boolean;
  include_dependencies?: boolean;
  new_title?: string;
}

export interface BulkTaskUpdateRequest {
  ids: string[];
  updates: Partial<TaskCreateRequest>;
}

export interface BulkTaskDeleteRequest {
  ids: string[];
}

export interface BulkTaskAssignRequest {
  task_ids: string[];
  user_ids: string[];
}

export interface TaskFilter {
  status?: string[];
  priority?: string[];
  type?: string[];
  assignee_ids?: string[];
  tag_ids?: string[];
  project_ids?: string[];
  due_date_range?: {
    start: string;
    end: string;
  };
}
