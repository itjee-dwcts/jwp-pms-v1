import {
  ArrowPathIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  FolderIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/use-auth';
import { useUsers } from '../../hooks/use-users';

// 활동 액션 상수 클래스
class ActivityActions {
  static readonly CREATE = 'create';
  static readonly UPDATE = 'update';
  static readonly DELETE = 'delete';
  static readonly VIEW = 'view';
  static readonly ASSIGN = 'assign';
  static readonly UNASSIGN = 'unassign';
  static readonly LOGIN = 'login';
  static readonly LOGOUT = 'logout';
  static readonly UPLOAD = 'upload';
  static readonly DOWNLOAD = 'download';
  static readonly COMMENT = 'comment';
  static readonly INVITE = 'invite';
  static readonly ARCHIVE = 'archive';
  static readonly RESTORE = 'restore';
  static readonly COMPLETE = 'complete';
  static readonly REOPEN = 'reopen';
  static readonly APPROVE = 'approve';
  static readonly REJECT = 'reject';
  static readonly NONE = 'none';

  static getAllActions() {
    return [
      this.CREATE, this.UPDATE, this.DELETE, this.VIEW, this.ASSIGN,
      this.UNASSIGN, this.LOGIN, this.LOGOUT, this.UPLOAD, this.DOWNLOAD,
      this.COMMENT, this.INVITE, this.ARCHIVE, this.RESTORE, this.COMPLETE,
      this.REOPEN, this.APPROVE, this.REJECT, this.NONE
    ];
  }
}

// 리소스 타입 상수 클래스
class ResourceTypes {
  static readonly PROJECT = 'project';
  static readonly TASK = 'task';
  static readonly USER = 'user';
  static readonly CALENDAR = 'calendar';
  static readonly EVENT = 'event';
  static readonly COMMENT = 'comment';
  static readonly ATTACHMENT = 'attachment';
  static readonly TEAM = 'team';
  static readonly ROLE = 'role';
  static readonly SETTING = 'setting';
  static readonly REPORT = 'report';
  static readonly NONE = 'none';

  static getAllTypes() {
    return [
      this.PROJECT, this.TASK, this.USER, this.CALENDAR, this.EVENT,
      this.COMMENT, this.ATTACHMENT, this.TEAM, this.ROLE, this.SETTING,
      this.REPORT, this.NONE
    ];
  }
}

type ActivityAction = typeof ActivityActions[keyof typeof ActivityActions];
type ResourceType = typeof ResourceTypes[keyof typeof ResourceTypes];

interface ActivityLog {
  id: string;
  user_id: string;
  action: ActivityAction;
  resource_type: ResourceType;
  resource_id?: number;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  metadata?: {
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    additional_info?: Record<string, any>;
  };
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  resource?: {
    id: string;
    name?: string;
    title?: string;
  };
}

interface ActivityFilters {
  user_id?: string;
  action?: ActivityAction;
  resource_type?: ResourceType;
  start_date?: string;
  end_date?: string;
  search?: string;
}

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

/**
 * 활동 로그 페이지 컴포넌트
 * 사용자 활동과 시스템 이벤트를 추적하고 표시합니다.
 */
const Activity: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { getUserActivity, getUsers } = useUsers();

  // 상태 관리
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ActivityFilters>({
    user_id: '',
    action: ActivityActions.NONE,
    resource_type: ResourceTypes.NONE,
    start_date: '',
    end_date: '',
    search: '',
  });

  // 컴포넌트 마운트 시 초기 설정
  useEffect(() => {
    // URL 파라미터에서 필터 초기화
    const userIdParam = searchParams.get('user_id');
    const actionParam = searchParams.get('action');
    const resourceTypeParam = searchParams.get('resource_type');

    if (userIdParam || actionParam || resourceTypeParam) {
      setFilters(prev => ({
        ...prev,
        user_id: userIdParam || '',
        action: (actionParam as ActivityAction) || ActivityActions.NONE,
        resource_type: (resourceTypeParam as ResourceType) || ResourceTypes.NONE,
      }));
      setShowFilters(true);
    }

    fetchUsers();
    fetchActivities(true);
  }, []);

  // 필터 변경 시 URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  /**
   * 사용자 목록 가져오기
   */
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const usersData = await getUsers({ page_size: 100 });
      setUsers(usersData);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  /**
   * 활동 로그 가져오기
   */
  const fetchActivities = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage = reset ? 1 : page;

      // 특정 사용자가 선택되지 않고 현재 사용자가 있으면 해당 사용자의 활동 표시
      const targetUserId = filters.user_id || currentUser?.id;

      if (!targetUserId) {
        throw new Error('선택된 사용자가 없습니다');
      }

      // undefined 속성을 제거하여 exactOptionalPropertyTypes 만족
      const params: Record<string, any> = {
        page_no: currentPage,
        page_size: 20,
      };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value;
        }
      });

      const data = await getUserActivity(targetUserId, params);

      if (reset) {
        setActivities(data as ActivityLog[]);
        setPage(2);
      } else {
        setActivities(prev => [...prev, ...(data as ActivityLog[])]);
        setPage(prev => prev + 1);
      }

      setHasMore(data.length === 20);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '활동 로그 로드에 실패했습니다';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터 변경 핸들러
   */
  const handleFilterChange = (field: keyof ActivityFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 필터 적용 핸들러
   */
  const handleApplyFilters = () => {
    setPage(1);
    fetchActivities(true);
  };

  /**
   * 필터 초기화 핸들러
   */
  const handleClearFilters = () => {
    setFilters({
      user_id: '',
      action: ActivityActions.NONE,
      resource_type: ResourceTypes.NONE,
      start_date: '',
      end_date: '',
      search: '',
    });
    setPage(1);
    fetchActivities(true);
  };

  /**
   * 더 많은 활동 로드
   */
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchActivities(false);
    }
  };

  /**
   * 액션에 따른 아이콘 반환
   */
  const getActionIcon = (action: ActivityAction) => {
    switch (action) {
      case ActivityActions.CREATE:
        return PlusIcon;
      case ActivityActions.UPDATE:
        return PencilIcon;
      case ActivityActions.DELETE:
        return TrashIcon;
      case ActivityActions.VIEW:
        return EyeIcon;
      case ActivityActions.LOGIN:
      case ActivityActions.LOGOUT:
        return UserIcon;
      case ActivityActions.COMPLETE:
        return CheckCircleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  /**
   * 액션에 따른 색상 반환
   */
  const getActionColor = (action: ActivityAction) => {
    switch (action) {
      case ActivityActions.CREATE:
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case ActivityActions.UPDATE:
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case ActivityActions.DELETE:
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case ActivityActions.COMPLETE:
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case ActivityActions.LOGIN:
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case ActivityActions.LOGOUT:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  /**
   * 리소스 타입에 따른 아이콘 반환
   */
  const getResourceIcon = (resourceType: ResourceType) => {
    switch (resourceType) {
      case ResourceTypes.PROJECT:
        return FolderIcon;
      case ResourceTypes.TASK:
        return DocumentTextIcon;
      case ResourceTypes.USER:
        return UserIcon;
      case ResourceTypes.CALENDAR:
      case ResourceTypes.EVENT:
        return CalendarIcon;
      default:
        return DocumentTextIcon;
    }
  };

  /**
   * 상대 시간 포맷팅
   */
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return '방금 전';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  /**
   * 활동 항목 렌더링
   */
  const renderActivityItem = (activity: ActivityLog) => {
    const ActionIcon = getActionIcon(activity.action);
    const ResourceIcon = getResourceIcon(activity.resource_type);
    const actionColor = getActionColor(activity.action);

    return (
      <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          {/* 액션 아이콘 */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${actionColor}`}>
            <ActionIcon className="w-4 h-4" />
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.user.full_name}
              </span>
              <Badge variant="default" className="text-xs">
                {String(activity.action)}
              </Badge>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <ResourceIcon className="w-3 h-3" />
                <span>{String(activity.resource_type)}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {activity.description}
            </p>

            {/* 리소스 링크 */}
            {activity.resource && (
              <div className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {activity.resource.name || activity.resource.title}
              </div>
            )}

            {/* 메타데이터 */}
            {activity.metadata?.additional_info && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <details className="group">
                  <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    세부 정보 보기
                  </summary>
                  <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                    {JSON.stringify(activity.metadata.additional_info, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* 타임스탬프 및 IP */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>{formatTimeAgo(activity.created_at)}</span>
                {activity.ip_address && (
                  <span>IP: {activity.ip_address}</span>
                )}
              </div>
              <span>{new Date(activity.created_at).toLocaleString('ko-KR')}</span>
            </div>
          </div>

          {/* 사용자 아바타 */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {activity.user.avatar_url ? (
                <img
                  src={activity.user.avatar_url}
                  alt={`${activity.user.full_name}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {activity.user.full_name[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            활동 로그
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            사용자 활동과 시스템 이벤트를 추적합니다
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            onClick={() => fetchActivities(true)}
            disabled={loading}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            필터
          </Button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            활동 필터링
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 사용자 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                사용자
              </label>
              <select
                value={filters.user_id || ''}
                onChange={(e) => handleFilterChange('user_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={usersLoading}
                title="사용자"
              >
                <option value="">모든 사용자</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 액션 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                액션
              </label>
              <select
                value={filters.action ? String(filters.action) : ''}
                onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                title="액션"
              >
                <option value="">모든 액션</option>
                <option value={ActivityActions.CREATE}>생성</option>
                <option value={ActivityActions.UPDATE}>수정</option>
                <option value={ActivityActions.DELETE}>삭제</option>
                <option value={ActivityActions.VIEW}>보기</option>
                <option value={ActivityActions.ASSIGN}>할당</option>
                <option value={ActivityActions.LOGIN}>로그인</option>
                <option value={ActivityActions.LOGOUT}>로그아웃</option>
                <option value={ActivityActions.COMPLETE}>완료</option>
              </select>
            </div>

            {/* 리소스 타입 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                리소스 타입
              </label>
              <select
                value={filters.resource_type ? String(filters.resource_type) : ''}
                onChange={(e) => handleFilterChange('resource_type', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                title="리소스 타입"
              >
                <option value="">모든 타입</option>
                <option value={ResourceTypes.PROJECT}>프로젝트</option>
                <option value={ResourceTypes.TASK}>작업</option>
                <option value={ResourceTypes.USER}>사용자</option>
                <option value={ResourceTypes.CALENDAR}>캘린더</option>
                <option value={ResourceTypes.EVENT}>이벤트</option>
                <option value={ResourceTypes.COMMENT}>댓글</option>
              </select>
            </div>

            {/* 시작 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                시작 날짜
              </label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                종료 날짜
              </label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* 검색 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              설명 검색
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="활동 설명을 검색하세요..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* 필터 액션 */}
          <div className="flex items-center space-x-4 mt-6">
            <Button onClick={handleApplyFilters} disabled={loading}>
              필터 적용
            </Button>
            <Button variant="secondary" onClick={handleClearFilters}>
              모두 지우기
            </Button>
          </div>
        </Card>
      )}

      {/* 활동 목록 */}
      <div className="space-y-4">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => fetchActivities(true)} />
        ) : activities.length === 0 ? (
          <Card className="p-12 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              활동이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              현재 필터와 일치하는 활동이 없습니다.
            </p>
          </Card>
        ) : (
          <>
            {activities.map(renderActivityItem)}

            {/* 더 보기 버튼 */}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      로딩 중...
                    </>
                  ) : (
                    '더 보기'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Activity;
