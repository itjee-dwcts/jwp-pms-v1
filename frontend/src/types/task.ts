export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'task' | 'bug' | 'feature' | 'improvement' | 'research';
export type DependencyType = 'blocks' | 'blocked_by' | 'relates_to';
export type SortOrder = 'asc' | 'desc';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
  project: {
    id: number;
    name: string;
  };
  assignees: TaskAssignee[];
  creator: {
    id: number;
    username: string;
    full_name: string;
  };
  parent_task?: {
    id: number;
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
  id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  assigned_at: string;
  assigned_by: number;
}

export interface TaskTag {
  id: number;
  name: string;
  color: string;
  created_at: string;
  usage_count?: number;
}

export interface TaskComment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    full_name: string;
    avatar_url?: string;
  };
  parent_id?: number;
  replies?: TaskComment[];
  is_edited?: boolean;
  mentions?: Array<{
    id: number;
    username: string;
  }>;
}

export interface TaskAttachment {
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

export interface TaskTimeLog {
  id: number;
  hours: number;
  description?: string;
  work_date: string;
  created_at: string;
  user: {
    id: number;
    full_name: string;
  };
  is_billable?: boolean;
}

export interface TaskDependency {
  id: number;
  dependent_task_id: number;
  dependency_task_id: number;
  dependency_type: DependencyType;
  created_at: string;
  dependency_task: {
    id: number;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
}

// Request/Response types
export interface TaskCreateRequest {
  title: string;
  description: string;
  project_id: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  due_date?: string;
  estimated_hours?: number;
  parent_task_id?: number;
  assignee_ids?: number[];
  tag_ids?: number[];
  dependency_ids?: number[];
}

export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {
  id: number;
}

export interface TaskSearchParams {
  search?: string;
  project_id?: number;
  assignee_id?: number;
  creator_id?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  due_before?: string;
  due_after?: string;
  created_before?: string;
  created_after?: string;
  tag_ids?: number[];
  has_due_date?: boolean;
  is_overdue?: boolean;
  parent_task_id?: number;
  page_no?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: SortOrder;
}

export interface TaskListResponse {
  tasks: Task[];
  total_items: number;
  page_no: number;
  page_size: number;
  total_pages: number;
}

export interface TaskStatsResponse {
  total_tasks: number;
  by_status: Record<TaskStatus, number>;
  by_priority: Record<TaskPriority, number>;
  by_type: Record<TaskType, number>;
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
  status: TaskStatus;
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
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  parent_id?: number;
  estimated_hours?: number;
  actual_hours?: number;
}

export interface CommentCreateRequest {
  content: string;
  parent_id?: number;
  mentions?: number[];
}

export interface CommentUpdateRequest {
  content: string;
  mentions?: number[];
}

export interface TimeLogCreateRequest {
  hours: number;
  description?: string;
  work_date: string;
  is_billable?: boolean;
}

export interface TimeLogUpdateRequest extends Partial<TimeLogCreateRequest> {
  id: number;
}

export interface AssignTaskRequest {
  user_ids: number[];
}

export interface TagCreateRequest {
  name: string;
  color: string;
}

export interface DependencyCreateRequest {
  dependency_task_id: number;
  dependency_type: DependencyType;
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
  ids: number[];
  updates: Partial<TaskCreateRequest>;
}

export interface BulkTaskDeleteRequest {
  ids: number[];
}

export interface BulkTaskAssignRequest {
  task_ids: number[];
  user_ids: number[];
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: TaskType[];
  assignee_ids?: number[];
  tag_ids?: number[];
  project_ids?: number[];
  due_date_range?: {
    start: string;
    end: string;
  };
}
