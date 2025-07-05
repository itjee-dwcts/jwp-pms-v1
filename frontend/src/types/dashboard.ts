// ============================================================================
// types/dashboard.ts - 대시보드 타입 정의
// 대시보드 관련 모든 TypeScript 타입 정의
// 통계, 활동, 이벤트, 필터 등의 인터페이스
// 확장 가능한 구조로 설계
// 실시간 업데이트, 권한, 성능 매트릭 등 고급 기능 포함
// ============================================================================

import type { BaseEntity } from './common';

/**
 * 대시보드 통계 파라미터
 */
export interface DashboardStatsParams {
  period?: '1d' | '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
  projectIds?: string[];
  userIds?: string[];
  type?: 'all' | 'projects' | 'tasks' | 'events';
  search?: string;
}

/**
 * 프로젝트 통계
 */
export interface ProjectStats {
  total_projects: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
}

/**
 * 작업 통계
 */
export interface TaskStats {
  total_tasks: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  assigned_to_user: number;
  overdue_tasks: number;
}

/**
 * 최근 활동
 */
export interface RecentActivity extends BaseEntity {
  action: string;
  description: string;
  user_name: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * 예정된 이벤트
 */
export interface UpcomingEvent extends BaseEntity {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  calendar_name: string;
  type?: 'meeting' | 'deadline' | 'reminder' | 'personal';
  status?: 'confirmed' | 'tentative' | 'cancelled';
  location?: string;
  attendee_count?: number;
}

/**
 * 대시보드 통계 메인 인터페이스
 */
export interface DashboardStats {
  projects: ProjectStats;
  tasks: TaskStats;
  recent_activity: RecentActivity[];
  upcoming_events: UpcomingEvent[];
  last_updated: string;
}

/**
 * 프로젝트 상태별 통계
 */
export interface ProjectStatusStats {
  planning: number;
  active: number;
  on_hold: number;
  completed: number;
  cancelled: number;
  total: number;
}

/**
 * 작업 상태별 통계
 */
export interface TaskStatusStats {
  open: number;
  in_progress: number;
  in_review: number;
  closed: number;
  cancelled: number;
  total: number;
}

/**
 * 사용자 워크로드 통계
 */
export interface UserWorkloadStats {
  assigned_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  hours_logged: number;
  projects_involved: number;
  avg_completion_time: number; // 평균 완료 시간 (분)
  productivity_score: number; // 생산성 점수 (0-100)
}

/**
 * 대시보드 요약 정보
 */
export interface DashboardSummary {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  team_members: number;
  upcoming_deadlines: number;
}

/**
 * 대시보드 트렌드 정보
 */
export interface DashboardTrends {
  project_completion_rate: number; // 프로젝트 완료율 (%)
  task_completion_rate: number; // 작업 완료율 (%)
  average_task_duration: number; // 평균 작업 기간 (일)
  team_productivity: number; // 팀 생산성 점수 (0-100)
}

/**
 * 대시보드 알림 정보
 */
export interface DashboardAlerts {
  overdue_tasks: number;
  approaching_deadlines: number;
  budget_warnings: number;
  resource_conflicts: number;
}

/**
 * 대시보드 빠른 통계
 */
export interface DashboardQuickStats {
  today_tasks: number;
  this_week_deadlines: number;
  active_meetings: number;
  pending_approvals: number;
}

/**
 * 대시보드 개요 정보
 */
export interface DashboardOverview {
  summary: DashboardSummary;
  trends: DashboardTrends;
  alerts: DashboardAlerts;
  quick_stats: DashboardQuickStats;
}

/**
 * 대시보드 필터
 */
export interface DashboardFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  projectIds?: string[];
  userIds?: string[];
  departments?: string[];
  priorities?: string[];
  statuses?: string[];
  includeArchived?: boolean;
  includeCompleted?: boolean;
}

/**
 * 사용자 활동 로그 요청
 */
export interface UserActivityLogRequest {
  action: string;
  description: string;
  resource_type?: string;
  resource_id?: string;
  extra_data?: Record<string, any>;
}

/**
 * 차트 데이터 포인트
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

/**
 * 시계열 차트 데이터
 */
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * 대시보드 위젯 설정
 */
export interface DashboardWidgetConfig {
  id: string;
  type: 'chart' | 'stats' | 'list' | 'calendar' | 'progress';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings: Record<string, any>;
  isVisible: boolean;
}

/**
 * 대시보드 레이아웃 설정
 */
export interface DashboardLayout {
  widgets: DashboardWidgetConfig[];
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number; // 자동 새로고침 간격 (초)
  showNotifications: boolean;
  compactMode: boolean;
}

/**
 * 대시보드 내보내기 옵션
 */
export interface DashboardExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'png';
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  sections?: string[]; // 포함할 섹션들
}

/**
 * 대시보드 알림 설정
 */
export interface DashboardNotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  slackNotifications: boolean;
  thresholds: {
    overdueTasks: number;
    budgetWarning: number;
    deadlineWarning: number; // 마감일 며칠 전에 알림
  };
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

/**
 * 대시보드 메트릭
 */
export interface DashboardMetrics {
  performance: {
    loadTime: number;
    lastUpdated: string;
    dataFreshness: number; // 데이터 신선도 (분)
  };
  usage: {
    dailyActiveUsers: number;
    pageViews: number;
    averageSessionDuration: number;
  };
  system: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}

/**
 * 대시보드 사용자 설정
 */
export interface DashboardUserPreferences {
  defaultView: 'overview' | 'projects' | 'tasks' | 'calendar';
  autoRefresh: boolean;
  refreshInterval: number;
  compactMode: boolean;
  showAnimations: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  favoriteWidgets: string[];
  hiddenWidgets: string[];
}

/**
 * 대시보드 검색 결과
 */
export interface DashboardSearchResult {
  type: 'project' | 'task' | 'user' | 'event';
  id: string;
  title: string;
  description?: string;
  url: string;
  relevance: number; // 검색 관련성 점수
  highlight?: string; // 하이라이트된 텍스트
}

/**
 * 대시보드 북마크
 */
export interface DashboardBookmark {
  id: string;
  name: string;
  url: string;
  filters: DashboardFilters;
  isShared: boolean;
  createdAt: string;
  createdBy: string;
}

/**
 * 대시보드 상태
 */
export type DashboardStatus = 'loading' | 'ready' | 'error' | 'offline';

/**
 * 대시보드 권한
 */
export interface DashboardPermissions {
  canView: boolean;
  canEdit: boolean;
  canExport: boolean;
  canShare: boolean;
  canManageUsers: boolean;
  canViewSensitiveData: boolean;
}

/**
 * 대시보드 API 응답
 */
export interface DashboardApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  cache?: {
    hit: boolean;
    ttl: number;
  };
}

/**
 * 대시보드 실시간 업데이트
 */
export interface DashboardRealtimeUpdate {
  type: 'stats' | 'activity' | 'notification' | 'system';
  data: any;
  timestamp: string;
  userId?: string;
  projectId?: string;
}

/**
 * 대시보드 에러
 */
export interface DashboardError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  recoverable: boolean;
}

/**
 * 대시보드 캐시 설정
 */
export interface DashboardCacheConfig {
  enabled: boolean;
  ttl: number; // Time to live (초)
  maxSize: number; // 최대 캐시 크기 (MB)
  strategy: 'lru' | 'fifo' | 'ttl';
}

/**
 * 대시보드 성능 메트릭
 */
export interface DashboardPerformanceMetrics {
  renderTime: number;
  dataFetchTime: number;
  chartRenderTime: number;
  memoryUsage: number;
  bundleSize: number;
}

/**
 * 대시보드 A/B 테스트 설정
 */
export interface DashboardABTestConfig {
  enabled: boolean;
  variant: 'A' | 'B';
  metrics: string[];
  startDate: string;
  endDate: string;
}
