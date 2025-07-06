export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ReportType = 'overview' | 'projects' | 'tasks' | 'users' | 'calendar';

export interface BaseExportOptions {
  type: ReportType;
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

// Removed duplicate ExportStatus interface with status: 'pending' | 'processing' | 'completed' | 'failed'
// Use the ExportStatus interface defined later with status: ExportStatusType

export interface ReportFilters {
  dateRange: string;
  startDate?: string;
  endDate?: string;
  projectIds?: string[];
  userIds?: string[];
  taskIds?: string[];
  teamIds?: string[];
  tagIds?: string[];
  statusFilter?: string[];
  priorityFilter?: string[];
}

export interface ReportSummary {
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  active_users: number;
  completion_rate: number;
  average_task_duration: number;
  total_hours_logged: number;
  average_project_duration: number;
  overdue_tasks: number;
  budget_utilization?: number;
}

export interface ProjectStats {
  project_id: string;
  project_name: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  total_hours: number;
  budget_used?: number;
  team_size: number;
  start_date: string;
  end_date?: string;
  status: string;
}

export interface TaskStatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface UserProductivity {
  user_id: string;
  user_name: string;
  completed_tasks: number;
  hours_logged: number;
  efficiency_score: number;
  project_count: number;
  average_task_time: number;
  billable_hours?: number;
}

export interface TimelineData {
  date: string;
  created_tasks: number;
  completed_tasks: number;
  active_projects: number;
  hours_logged: number;
  users_active: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface TeamPerformance {
  team_id: string;
  team_name: string;
  member_count: number;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  total_hours: number;
  average_velocity: number;
}

export interface ReportData {
  summary: ReportSummary;
  project_stats: ProjectStats[];
  task_status_distribution: TaskStatusDistribution[];
  user_productivity: UserProductivity[];
  timeline_data: TimelineData[];
  priority_distribution: PriorityDistribution[];
  team_performance?: TeamPerformance[];
  generated_at: string;
  filters_applied: ReportFilters;
}

export interface ExportOptions {
  type: string;
  format: string;
  filters: ReportFilters;
  template?: string;
  include_charts?: boolean;
  include_raw_data?: boolean;
}

export interface ReportMetrics {
  projects: {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    on_hold: number;
  };
  tasks: {
    total: number;
    open: number;
    in_progress: number;
    completed: number;
    overdue: number;
    blocked: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    most_productive: UserProductivity[];
  };
  performance: {
    average_completion_time: number;
    productivity_score: number;
    burndown_rate: number;
    velocity: number;
    quality_score?: number;
  };
  time_tracking: {
    total_logged_hours: number;
    billable_hours: number;
    average_daily_hours: number;
    most_active_day: string;
  };
}

export interface ProjectReport {
  project: {
    id: string;
    name: string;
    description: string;
    status: string;
    start_date: string;
    end_date?: string;
  };
  summary: {
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    total_hours: number;
    team_size: number;
    budget_used?: number;
  };
  tasks: TaskStats[];
  team_members: UserProductivity[];
  timeline: TimelineData[];
  milestones?: Milestone[];
}

export interface UserReport {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
  summary: {
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    total_hours: number;
    projects_count: number;
    efficiency_score: number;
  };
  projects: ProjectStats[];
  tasks: TaskStats[];
  time_logs: TimeLogStats[];
  activity_timeline: TimelineData[];
}

export interface TaskReport {
  summary: {
    total_tasks: number;
    by_status: TaskStatusDistribution[];
    by_priority: PriorityDistribution[];
    by_type?: TypeDistribution[];
    overdue_count: number;
  };
  trends: {
    creation_trend: TimelineData[];
    completion_trend: TimelineData[];
    backlog_growth: TimelineData[];
  };
  performance: {
    average_completion_time: number;
    cycle_time: number;
    lead_time: number;
    throughput: number;
  };
}

export interface TimeTrackingReport {
  summary: {
    total_hours: number;
    billable_hours: number;
    average_daily_hours: number;
    total_sessions: number;
  };
  breakdown: {
    by_user: UserProductivity[];
    by_project: ProjectStats[];
    by_date: TimelineData[];
    by_activity_type?: ActivityBreakdown[];
  };
  insights: {
    most_productive_hours: string[];
    most_productive_days: string[];
    peak_activity_periods: PeakPeriod[];
  };
}

export interface TaskStats {
  task_id: string;
  title: string;
  status: string;
  priority: string;
  estimated_hours?: number;
  actual_hours?: number;
  completion_rate: number;
  assignees: string[];
}

export interface TimeLogStats {
  date: string;
  hours: number;
  billable_hours: number;
  description?: string;
  project_name: string;
}

export interface Milestone {
  id: string;
  name: string;
  due_date: string;
  completion_rate: number;
  status: string;
}

export interface TypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface ActivityBreakdown {
  activity_type: string;
  hours: number;
  percentage: number;
}

export interface PeakPeriod {
  period: string;
  hours: number;
  activity_level: 'low' | 'medium' | 'high';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  default_filters: ReportFilters;
  layout_config: Record<string, any>;
  created_by: string;
  is_public: boolean;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  filters: ReportFilters;
  export_format: string;
  recipients: string[];
  next_run: string;
  is_active: boolean;
}

export type ExportStatusType = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ExportStatus {
  id: string;
  status: ExportStatusType;
  progress: number; // 0-100
  message?: string;
  filename?: string;
  download_url?: string;
  file_size?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  cancelled_at?: string;
  expires_at?: string;
  error_message?: string;
  created_by: {
    id: string;
    username: string;
    full_name: string;
  };
}

export interface ExtendedExportOptions {
  type: string; // 'overview' | 'projects' | 'tasks' | 'users' | 'productivity' | 'timeline'
  format: string;
  filters: ReportFilters;
  template?: string;
  include_charts?: boolean;
  include_raw_data?: boolean;
  custom_fields?: string[];
  email_recipients?: string[];
}

// Export History 응답 타입
export interface ExportHistoryResponse {
  exports: ExportStatus[];
  page_no: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
}

// Export 요청 옵션
export interface ExportRequestOptions {
  page_no?: number;
  page_size?: number;
  format?: string;
  status?: string;
  created_after?: string;
  created_before?: string;
  order_by?: 'created_at' | 'completed_at' | 'status';
  order_direction?: 'asc' | 'desc';
}
