// ============================================================================
// dashboard-service.ts - 대시보드 REST API 서비스
// ============================================================================

import type {
  DashboardFilters,
  DashboardOverview,
  DashboardStats,
  DashboardStatsParams,
  ProjectStatusStats,
  RecentActivity,
  TaskStatusStats,
  UpcomingEvent,
  UserActivityLogRequest,
  UserWorkloadStats
} from '@/types/dashboard';
import { buildQueryParams } from '@/utils/query-params';
import { apiClient } from './api-client';

export class DashboardService {
  private readonly baseUrl = '/api/v1/dashboard';

  // ============================================================================
  // 대시보드 통계 메서드들
  // ============================================================================

  /**
   * 대시보드 통계 조회
   */
  async getDashboardStats(params?: DashboardStatsParams): Promise<DashboardStats> {
    const queryString = params ? buildQueryParams(params) : '';
    const endpoint = queryString ? `${this.baseUrl}/stats?${queryString}` : `${this.baseUrl}/stats`;

    return apiClient.request<DashboardStats>(endpoint);
  }

  /**
   * 최근 활동 조회
   */
  async getRecentActivities(limit = 10, offset = 0): Promise<RecentActivity[]> {
    const queryString = buildQueryParams({ limit, offset });
    return apiClient.request<RecentActivity[]>(`${this.baseUrl}/activities?${queryString}`);
  }

  /**
   * 예정된 이벤트 조회
   */
  async getUpcomingEvents(limit = 5, days = 7): Promise<UpcomingEvent[]> {
    const queryString = buildQueryParams({ limit, days });
    return apiClient.request<UpcomingEvent[]>(`${this.baseUrl}/events?${queryString}`);
  }

  /**
   * 프로젝트 상태별 통계 조회
   */
  async getProjectStatusStats(): Promise<ProjectStatusStats> {
    return apiClient.request<ProjectStatusStats>(`${this.baseUrl}/stats/projects`);
  }

  /**
   * 작업 상태별 통계 조회
   */
  async getTaskStatusStats(): Promise<TaskStatusStats> {
    return apiClient.request<TaskStatusStats>(`${this.baseUrl}/stats/tasks`);
  }

  /**
   * 사용자 워크로드 통계 조회
   */
  async getUserWorkloadStats(userId?: string): Promise<UserWorkloadStats> {
    const endpoint = userId
      ? `${this.baseUrl}/stats/workload/${userId}`
      : `${this.baseUrl}/stats/workload`;

    return apiClient.request<UserWorkloadStats>(endpoint);
  }

  /**
   * 대시보드 개요 정보 조회
   */
  async getDashboardOverview(filters?: DashboardFilters): Promise<DashboardOverview> {
    const queryString = filters ? buildQueryParams(filters) : '';
    const endpoint = queryString ? `${this.baseUrl}/overview?${queryString}` : `${this.baseUrl}/overview`;

    return apiClient.request<DashboardOverview>(endpoint);
  }

  // ============================================================================
  // 사용자 활동 관리
  // ============================================================================

  /**
   * 사용자 활동 로그 추가
   */
  async logUserActivity(input: UserActivityLogRequest): Promise<RecentActivity> {
    return apiClient.request<RecentActivity>(`${this.baseUrl}/activities`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * 사용자 활동 로그 상세 조회
   */
  async getActivityDetail(activityId: string): Promise<RecentActivity> {
    return apiClient.request<RecentActivity>(`${this.baseUrl}/activities/${activityId}`);
  }

  /**
   * 사용자별 활동 내역 조회
   */
  async getUserActivities(
    userId: string,
    params?: {
      page_size?: number;
      page_no?: number;
      startDate?: string;
      endDate?: string;
      action?: string;
    }
  ): Promise<{
    activities: RecentActivity[];
    total: number;
  }> {
    const queryString = params ? buildQueryParams(params) : '';
    const endpoint = queryString
      ? `${this.baseUrl}/users/${userId}/activities?${queryString}`
      : `${this.baseUrl}/users/${userId}/activities`;

    return apiClient.request(endpoint);
  }

  // ============================================================================
  // 이벤트 관리
  // ============================================================================

  /**
   * 이벤트 상세 조회
   */
  async getEventDetail(eventId: string): Promise<UpcomingEvent> {
    return apiClient.request<UpcomingEvent>(`${this.baseUrl}/events/${eventId}`);
  }

  /**
   * 사용자별 예정된 이벤트 조회
   */
  async getUserEvents(
    userId: string,
    params?: {
      page_size?: number;
      days?: number;
      status?: string;
    }
  ): Promise<UpcomingEvent[]> {
    const queryString = params ? buildQueryParams(params) : '';
    const endpoint = queryString
      ? `${this.baseUrl}/users/${userId}/events?${queryString}`
      : `${this.baseUrl}/users/${userId}/events`;

    return apiClient.request<UpcomingEvent[]>(endpoint);
  }

  // ============================================================================
  // 설정 관리
  // ============================================================================

  /**
   * 대시보드 설정 업데이트
   */
  async updateDashboardSettings(settings: Partial<DashboardFilters>): Promise<void> {
    await apiClient.request(`${this.baseUrl}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  /**
   * 대시보드 설정 조회
   */
  async getDashboardSettings(): Promise<DashboardFilters> {
    return apiClient.request<DashboardFilters>(`${this.baseUrl}/settings`);
  }

  /**
   * 대시보드 설정 초기화
   */
  async resetDashboardSettings(): Promise<void> {
    await apiClient.request(`${this.baseUrl}/settings/reset`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // 데이터 내보내기
  // ============================================================================

  /**
   * 대시보드 데이터 내보내기 (즉시 다운로드)
   */
  async exportDashboardData(
    format: 'json' | 'csv' | 'excel' = 'json',
    filters?: DashboardFilters
  ): Promise<Blob> {
    const params = {
      format,
      ...(filters || {}),
    };
    const queryString = buildQueryParams(params);

    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/export?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to export dashboard data');
    }

    return response.blob();
  }

  /**
   * 비동기 대시보드 데이터 내보내기 시작
   */
  async startAsyncExport(
    format: 'json' | 'csv' | 'excel' = 'json',
    filters?: DashboardFilters
  ): Promise<string> {
    const response = await apiClient.request<{ export_id: string }>(`${this.baseUrl}/export/async`, {
      method: 'POST',
      body: JSON.stringify({
        format,
        filters: filters || {},
      }),
    });

    return response.export_id;
  }

  /**
   * 내보내기 상태 확인
   */
  async getExportStatus(exportId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    download_url?: string;
    expires_at?: string;
    error_message?: string;
  }> {
    return apiClient.request(`${this.baseUrl}/export/${exportId}/status`);
  }

  /**
   * 내보낸 파일 다운로드
   */
  async downloadExport(exportId: string): Promise<Blob> {
    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/export/${exportId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to download export file');
    }

    return response.blob();
  }

  /**
   * 내보내기 작업 취소
   */
  async cancelExport(exportId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/export/${exportId}/cancel`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // 캐시 관리
  // ============================================================================

  /**
   * 대시보드 캐시 무효화
   */
  async invalidateCache(): Promise<void> {
    await apiClient.request(`${this.baseUrl}/cache/invalidate`, {
      method: 'POST',
    });
  }

  /**
   * 특정 데이터 캐시 무효화
   */
  async invalidateSpecificCache(cacheKeys: string[]): Promise<void> {
    await apiClient.request(`${this.baseUrl}/cache/invalidate/specific`, {
      method: 'POST',
      body: JSON.stringify({ cache_keys: cacheKeys }),
    });
  }

  /**
   * 캐시 상태 조회
   */
  async getCacheStatus(): Promise<{
    total_keys: number;
    memory_usage: number;
    hit_rate: number;
    last_cleanup: string;
  }> {
    return apiClient.request(`${this.baseUrl}/cache/status`);
  }

  // ============================================================================
  // 알림 관리
  // ============================================================================

  /**
   * 대시보드 알림 조회
   */
  async getDashboardNotifications(
    params?: {
      page_size?: number;
      page_no?: number;
      unread_only?: boolean;
      priority?: string;
    }
  ): Promise<{
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      priority: string;
      read_at?: string;
      created_at: string;
      action_url?: string;
    }>;
    total: number;
    unread_count: number;
  }> {
    const queryString = params ? buildQueryParams(params) : '';
    const endpoint = queryString
      ? `${this.baseUrl}/notifications?${queryString}`
      : `${this.baseUrl}/notifications`;

    return apiClient.request(endpoint);
  }

  /**
   * 알림 읽음 처리
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllNotificationsAsRead(): Promise<void> {
    await apiClient.request(`${this.baseUrl}/notifications/read-all`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // 실시간 업데이트 (WebSocket 대신 폴링)
  // ============================================================================

  /**
   * 대시보드 데이터 폴링을 위한 간단한 변경 감지
   */
  async checkForUpdates(lastUpdate?: string): Promise<{
    has_updates: boolean;
    last_updated: string;
    updated_sections: string[];
  }> {
    const params = lastUpdate ? { last_update: lastUpdate } : {};
    const queryString = buildQueryParams(params);
    const endpoint = queryString
      ? `${this.baseUrl}/updates?${queryString}`
      : `${this.baseUrl}/updates`;

    return apiClient.request(endpoint);
  }

  // ============================================================================
  // 성능 메트릭
  // ============================================================================

  /**
   * 대시보드 성능 메트릭 조회
   */
  async getPerformanceMetrics(): Promise<{
    load_time: number;
    query_time: number;
    cache_hit_rate: number;
    active_users: number;
    memory_usage: number;
  }> {
    return apiClient.request(`${this.baseUrl}/metrics/performance`);
  }

  /**
   * 사용자 활동 통계 조회
   */
  async getActivityMetrics(
    period: '1d' | '7d' | '30d' = '7d'
  ): Promise<{
    total_activities: number;
    unique_users: number;
    most_active_users: Array<{
      user_id: string;
      username: string;
      activity_count: number;
    }>;
    activity_by_hour: Array<{
      hour: number;
      count: number;
    }>;
    activity_by_type: Record<string, number>;
  }> {
    return apiClient.request(`${this.baseUrl}/metrics/activity?period=${period}`);
  }
}

// Singleton instance
export const dashboardService = new DashboardService();
