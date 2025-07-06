import {
  ArrowTrendingUpIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Select from '../../components/ui/Select';
import { useAuth } from '../../hooks/use-auth';
import { useDashboard } from '../../hooks/use-dashboard';
import type {
  DashboardStatsParams
} from '../../types/dashboard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // 대시보드 훅 사용
  const {
    stats,
    activities,
    events,
    loading,
    error,
    getDashboardStats,
    getRecentActivities,
    getUpcomingEvents,
    refreshDashboard,
    clearError,
  } = useDashboard();

  // 로컬 상태
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterPeriod, setFilterPeriod] = useState(searchParams.get('period') || '7d');
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');

  // 검색 파라미터 업데이트
  const updateSearchParams = useCallback((params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // 검색 처리
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    updateSearchParams({ search: query });
  }, [updateSearchParams]);

  // 필터 처리
  const handleFilterChange = useCallback((type: 'period' | 'type', value: string) => {
    if (type === 'period') {
      setFilterPeriod(value);
      updateSearchParams({ period: value });
    } else if (type === 'type') {
      setFilterType(value);
      updateSearchParams({ type: value });
    }
  }, [updateSearchParams]);

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async () => {
    try {
      clearError();

      const params: DashboardStatsParams = {
        period: filterPeriod as '1d' | '7d' | '30d' | '90d' | 'custom',
        type: filterType as 'all' | 'projects' | 'tasks' | 'events',
        ...(searchQuery ? { search: searchQuery } : {}),
      };

      await getDashboardStats(params);
      await getRecentActivities(10, 0);
      await getUpcomingEvents(5, 7);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '대시보드 데이터를 불러오는데 실패했습니다';
      toast.error(errorMessage);
    }
  }, [filterPeriod, filterType, searchQuery, getDashboardStats, getRecentActivities, getUpcomingEvents, clearError]);

  // 데이터 새로고침
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      clearError();

      const params: DashboardStatsParams = {
        period: filterPeriod as '1d' | '7d' | '30d' | '90d' | 'custom',
        type: filterType as 'all' | 'projects' | 'tasks' | 'events',
        ...(searchQuery ? { search: searchQuery } : {}),
      };

      await refreshDashboard(params);
      toast.success('대시보드가 새로고침되었습니다');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '새로고침에 실패했습니다';
      toast.error(errorMessage);
    } finally {
      setRefreshing(false);
    }
  }, [filterPeriod, filterType, searchQuery, refreshDashboard, clearError]);

  // 초기 데이터 로드
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 차트 데이터 포맷팅
  const formatChartData = (data: Record<string, number>) => {
    return Object.entries(data).map(([key, value]) => ({
      name: key.replace('_', ' ').toUpperCase(),
      value,
    }));
  };

  // 활동 필터링
  const filteredActivities = activities.filter(activity => {
    if (!searchQuery) return true;
    return activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
           activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           activity.user_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 이벤트 필터링
  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true;
    return event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (event.calendar_name && event.calendar_name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ErrorMessage message={error} />
          <Button onClick={loadDashboardData} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            대시보드
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            안녕하세요, {user?.username || '사용자'}님!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            variant="default"
            size="sm"
          >
            {refreshing ? <LoadingSpinner size="sm" /> : '새로고침'}
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            최종 업데이트: {stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : '-'}
          </span>
        </div>
      </div>

      {/* 에러 메시지 (데이터가 있지만 에러가 발생한 경우) */}
      {error && stats && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* 검색 및 필터 */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="활동, 이벤트, 사용자 검색..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select
              value={filterPeriod}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              options={[
                { value: '1d', label: '오늘' },
                { value: '7d', label: '최근 7일' },
                { value: '30d', label: '최근 30일' },
                { value: '90d', label: '최근 90일' },
              ]}
            />
            <Select
              value={filterType}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              options={[
                { value: 'all', label: '전체' },
                { value: 'projects', label: '프로젝트' },
                { value: 'tasks', label: '작업' },
                { value: 'events', label: '이벤트' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FolderIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                전체 프로젝트
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.projects?.total_projects || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                전체 작업
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.tasks?.total_tasks || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                내 작업
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.tasks?.assigned_to_user || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                지연된 작업
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.tasks?.overdue_tasks || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 프로젝트 상태 차트 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              프로젝트 현황
            </h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          {stats?.projects?.by_status ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatChartData(stats.projects.by_status)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatChartData(stats.projects.by_status).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              데이터가 없습니다
            </div>
          )}
        </Card>

        {/* 작업 상태 차트 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              작업 현황
            </h3>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
          </div>
          {stats?.tasks?.by_status ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={formatChartData(stats.tasks.by_status)}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              데이터가 없습니다
            </div>
          )}
        </Card>
      </div>

      {/* 최근 활동 및 예정된 이벤트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              최근 활동
            </h3>
            <UserGroupIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {filteredActivities.length > 0 ? (
              filteredActivities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user_name}</span>{' '}
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {searchQuery ? '검색 결과가 없습니다' : '최근 활동이 없습니다'}
              </p>
            )}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/activity')}
              className="w-full"
            >
              전체 활동 보기
            </Button>
          </div>
        </Card>

        {/* 예정된 이벤트 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              예정된 이벤트
            </h3>
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {filteredEvents.length > 0 ? (
              filteredEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </p>
                    {event.calendar_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {event.calendar_name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(event.start_time).toLocaleString()} -{' '}
                      {new Date(event.end_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {searchQuery ? '검색 결과가 없습니다' : '예정된 이벤트가 없습니다'}
              </p>
            )}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/calendar')}
              className="w-full"
            >
              캘린더 보기
            </Button>
          </div>
        </Card>
      </div>

      {/* 빠른 작업 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          빠른 작업
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => navigate('/projects/new')}
            className="justify-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            새 프로젝트
          </Button>
          <Button
            onClick={() => navigate('/tasks/new')}
            variant="outline"
            className="justify-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            새 작업
          </Button>
          <Button
            onClick={() => navigate('/calendar/event/new')}
            variant="outline"
            className="justify-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            새 이벤트
          </Button>
          <Button
            onClick={() => navigate('/reports')}
            variant="outline"
            className="justify-center"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            보고서 보기
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
