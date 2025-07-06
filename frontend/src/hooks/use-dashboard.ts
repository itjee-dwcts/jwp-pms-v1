// ============================================================================
// use-dashboard.ts - 대시보드 관련 훅
// ============================================================================

import { useCallback, useState } from 'react';
import { dashboardService } from '../services/dashboard-service';
import type {
  DashboardFilters,
  DashboardOverview,
  DashboardStats,
  DashboardStatsParams,
  ProjectStatusStats,
  RecentActivity,
  TaskStatusStats,
  UpcomingEvent,
  UserWorkloadStats
} from '../types/dashboard';

/**
 * 대시보드 상태 인터페이스
 */
interface DashboardState {
  stats: DashboardStats | null;
  activities: RecentActivity[];
  events: UpcomingEvent[];
  overview: DashboardOverview | null;
  loading: boolean;
  error: string | null;
}

/**
 * 대시보드 상태 관리 훅
 */
const useDashboardState = () => {
  const [state, setState] = useState<DashboardState>({
    stats: null,
    activities: [],
    events: [],
    overview: null,
    loading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<DashboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setStats = useCallback((stats: DashboardStats | null) => {
    updateState({ stats });
  }, [updateState]);

  const setActivities = useCallback((activities: RecentActivity[]) => {
    updateState({ activities });
  }, [updateState]);

  const setEvents = useCallback((events: UpcomingEvent[]) => {
    updateState({ events });
  }, [updateState]);

  const setOverview = useCallback((overview: DashboardOverview | null) => {
    updateState({ overview });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const reset = useCallback(() => {
    setState({
      stats: null,
      activities: [],
      events: [],
      overview: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    setStats,
    setActivities,
    setEvents,
    setOverview,
    setLoading,
    setError,
    clearError,
    reset,
  };
};

/**
 * 대시보드 메인 훅
 */
export const useDashboard = () => {
  const dashboardState = useDashboardState();

  /**
   * 요청 처리 헬퍼
   */
  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>,
    showLoading = true
  ): Promise<T> => {
    if (showLoading) dashboardState.setLoading(true);
    dashboardState.setError(null);

    try {
      const result = await request();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '요청 처리 중 오류가 발생했습니다.';
      dashboardState.setError(errorMessage);
      throw err;
    } finally {
      if (showLoading) dashboardState.setLoading(false);
    }
  }, [dashboardState]);

  /**
   * 대시보드 통계 조회
   */
  const getDashboardStats = useCallback(async (
    params?: DashboardStatsParams
  ): Promise<DashboardStats> => {
    return handleRequest(async () => {
      const stats = await dashboardService.getDashboardStats(params);
      dashboardState.setStats(stats);
      return stats;
    });
  }, [handleRequest, dashboardState]);

  /**
   * 최근 활동 조회
   */
  const getRecentActivities = useCallback(async (
    limit?: number,
    offset?: number
  ): Promise<RecentActivity[]> => {
    return handleRequest(async () => {
      const activities = await dashboardService.getRecentActivities(limit, offset);
      dashboardState.setActivities(activities);
      return activities;
    }, false);
  }, [handleRequest, dashboardState]);

  /**
   * 예정된 이벤트 조회
   */
  const getUpcomingEvents = useCallback(async (
    limit?: number,
    days?: number
  ): Promise<UpcomingEvent[]> => {
    return handleRequest(async () => {
      const events = await dashboardService.getUpcomingEvents(limit, days);
      dashboardState.setEvents(events);
      return events;
    }, false);
  }, [handleRequest, dashboardState]);

  /**
   * 프로젝트 상태별 통계 조회
   */
  const getProjectStatusStats = useCallback(async (): Promise<ProjectStatusStats> => {
    return handleRequest(async () => {
      return await dashboardService.getProjectStatusStats();
    }, false);
  }, [handleRequest]);

  /**
   * 작업 상태별 통계 조회
   */
  const getTaskStatusStats = useCallback(async (): Promise<TaskStatusStats> => {
    return handleRequest(async () => {
      return await dashboardService.getTaskStatusStats();
    }, false);
  }, [handleRequest]);

  /**
   * 사용자 워크로드 통계 조회
   */
  const getUserWorkloadStats = useCallback(async (
    userId?: string
  ): Promise<UserWorkloadStats> => {
    return handleRequest(async () => {
      return await dashboardService.getUserWorkloadStats(userId);
    }, false);
  }, [handleRequest]);

  /**
   * 대시보드 개요 정보 조회
   */
  const getDashboardOverview = useCallback(async (
    filters?: DashboardFilters
  ): Promise<DashboardOverview> => {
    return handleRequest(async () => {
      const overview = await dashboardService.getDashboardOverview(filters);
      dashboardState.setOverview(overview);
      return overview;
    });
  }, [handleRequest, dashboardState]);

  /**
   * 전체 대시보드 데이터 새로고침
   */
  const refreshDashboard = useCallback(async (
    params?: DashboardStatsParams
  ): Promise<void> => {
    return handleRequest(async () => {
      // 병렬로 모든 데이터 조회
      const [stats, activities, events] = await Promise.all([
        dashboardService.getDashboardStats(params),
        dashboardService.getRecentActivities(10),
        dashboardService.getUpcomingEvents(5, 7),
      ]);

      dashboardState.setStats(stats);
      dashboardState.setActivities(activities);
      dashboardState.setEvents(events);
    });
  }, [handleRequest, dashboardState]);

  /**
   * 대시보드 데이터 내보내기
   */
  const exportDashboardData = useCallback(async (
    format: 'json' | 'csv' | 'excel' = 'json',
    filters?: DashboardFilters
  ): Promise<Blob> => {
    return handleRequest(async () => {
      return await dashboardService.exportDashboardData(format, filters);
    }, false);
  }, [handleRequest]);

  /**
   * 사용자 활동 로그 추가
   */
  const logUserActivity = useCallback(async (
    action: string,
    description: string,
    resourceType?: string,
    resourceId?: string
  ): Promise<void> => {
    return handleRequest(async () => {
      const logRequest: any = { action, description };
      if (resourceType !== undefined) logRequest.resource_type = resourceType;
      if (resourceId !== undefined) logRequest.resource_id = resourceId;
      await dashboardService.logUserActivity(logRequest);
    }, false);
  }, [handleRequest]);

  /**
   * 대시보드 설정 업데이트
   */
  const updateDashboardSettings = useCallback(async (
    settings: Partial<DashboardFilters>
  ): Promise<void> => {
    return handleRequest(async () => {
      await dashboardService.updateDashboardSettings(settings);
    }, false);
  }, [handleRequest]);

  return {
    // 상태
    stats: dashboardState.stats,
    activities: dashboardState.activities,
    events: dashboardState.events,
    overview: dashboardState.overview,
    loading: dashboardState.loading,
    error: dashboardState.error,

    // 메서드
    getDashboardStats,
    getRecentActivities,
    getUpcomingEvents,
    getProjectStatusStats,
    getTaskStatusStats,
    getUserWorkloadStats,
    getDashboardOverview,
    refreshDashboard,
    exportDashboardData,
    logUserActivity,
    updateDashboardSettings,

    // 유틸리티
    clearError: dashboardState.clearError,
    reset: dashboardState.reset,
  };
};

/**
 * 대시보드 통계만 사용하는 가벼운 훅
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (params?: DashboardStatsParams) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getDashboardStats(params);
      setStats(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '통계 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
    clearError: () => setError(null),
  };
};

/**
 * 최근 활동만 사용하는 훅
 */
export const useRecentActivities = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (limit = 10, offset = 0) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getRecentActivities(limit, offset);
      setActivities(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '활동 내역 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    activities,
    loading,
    error,
    fetchActivities,
    clearError: () => setError(null),
  };
};

/**
 * 예정된 이벤트만 사용하는 훅
 */
export const useUpcomingEvents = () => {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (limit = 5, days = 7) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getUpcomingEvents(limit, days);
      setEvents(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '예정된 이벤트 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    clearError: () => setError(null),
  };
};
