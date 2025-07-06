import {
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  FlagIcon,
  FunnelIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  Squares2X2Icon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/use-auth';
import { useProjects } from '../../hooks/use-projects';
import { useTasks } from '../../hooks/use-tasks';
import {
  Task,
  TaskListResponse,
  TaskSearchParams,
} from '../../types/task';

// 정렬 필드 타입
//type SortField = 'title' | 'created_at' | 'updated_at' | 'due_date' | 'status' | 'priority';

// 뷰 타입
type ViewType = 'list' | 'kanban';

// 필터 인터페이스 (내부 상태 관리용)
interface TaskFilters {
  search: string;
  project_id: string;
  assignee_id: string;
  status: string;
  priority: string;
  type: string;
  due_before: string;
  due_after: string;
  has_due_date: string;
  is_overdue: string;
  sort_by: string;
  sort_order: string;
}

/**
 * 작업 목록 페이지 컴포넌트
 * 모든 작업을 검색, 필터링, 정렬하여 표시합니다.
 */
const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { getTasks } = useTasks();
  const { getProjects } = useProjects();

  // 상태 관리
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('list');

  // 필터 상태
  const [filters, setFilters] = useState<TaskFilters>({
    search: searchParams.get('search') || '',
    project_id: searchParams.get('project_id') || '',
    assignee_id: searchParams.get('assignee_id') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    type: searchParams.get('type') || '',
    due_before: searchParams.get('due_before') || '',
    due_after: searchParams.get('due_after') || '',
    has_due_date: searchParams.get('has_due_date') || '',
    is_overdue: searchParams.get('is_overdue') || '',
    sort_by: searchParams.get('sort_by') || 'updated_at',
    sort_order: searchParams.get('sort_order') || 'desc',
  });

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [currentPage, filters]);

  // URL 파라미터 업데이트
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value.toString());
      }
    });

    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }

    setSearchParams(params);
  }, [filters, currentPage, setSearchParams]);

  /**
   * 작업 목록 가져오기
   */
  const fetchTasks = async () => {
    try {
      setLoading(true);

      const queryParams: TaskSearchParams = {
        ...filters,
        page_no: currentPage,
        page_size: pageSize,
      };

      const response: TaskListResponse = await getTasks(queryParams);
      setTasks(response.tasks);
      setTotalItems(response.total_items);
    } catch (error) {
      console.error('작업 목록 로드 실패:', error);
      toast.error('작업 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 프로젝트 목록 가져오기 (필터용)
   */
  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await getProjects({ page_size: 100 });
      setProjects(response.projects);
    } catch (error) {
      console.error('프로젝트 목록 로드 실패:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  /**
   * 필터 변경 핸들러
   */
  const handleFilterChange = (field: keyof TaskFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  /**
   * 검색어 변경 핸들러
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  /**
   * 필터 초기화
   */
  const clearFilters = () => {
    setFilters({
      search: '',
      project_id: '',
      assignee_id: '',
      status: '',
      priority: '',
      type: '',
      due_before: '',
      due_after: '',
      has_due_date: '',
      is_overdue: '',
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
    setCurrentPage(1);
  };

  /**
   * 페이지 변경 핸들러
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * 상태별 색상 반환
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      default:
        return '';
    }
  };

  /**
   * 우선순위별 색상 반환
   */
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      default:
        return '';
    }
  };

  /**
   * 타입별 색상 반환
   */
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'bug':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      case 'feature':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'improvement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      case 'research':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200';
      default:
        return '';
    }
  };

  /**
   * 상태 텍스트 변환
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return '할 일';
      case 'in_progress':
        return '진행 중';
      case 'in_review':
        return '검토 중';
      case 'done':
        return '완료';
      default:
        return '';
    }
  };

  /**
   * 우선순위 텍스트 변환
   */
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return '낮음';
      case 'medium':
        return '보통';
      case 'high':
        return '높음';
      case 'critical':
        return '긴급';
      default:
        return '';
    }
  };

  /**
   * 타입 텍스트 변환
   */
  const getTypeText = (type: string) => {
    switch (type) {
      case 'task':
        return '작업';
      case 'bug':
        return '버그';
      case 'feature':
        return '기능';
      case 'improvement':
        return '개선';
      case 'research':
        return '연구';
      default:
        return '';
    }
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * 마감일까지 남은 일수 계산
   */
  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}일 지연`;
    if (diffDays === 0) return '오늘 마감';
    if (diffDays === 1) return '내일 마감';
    return `${diffDays}일 남음`;
  };

  /**
   * 마감일 색상 반환
   */
  const getDueDateColor = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600 dark:text-red-400';
    if (diffDays <= 1) return 'text-orange-600 dark:text-orange-400';
    if (diffDays <= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  /**
   * 사용자가 작업 담당자인지 확인
   */
  const isTaskAssignee = (task: Task) => {
    return task.assignees.some(assignee => assignee.user.id === user?.id);
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            작업
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            모든 작업을 관리하고 추적하세요
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* 뷰 전환 버튼 */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewType === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('list')}
              className="px-3"
            >
              <ListBulletIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('kanban')}
              className="px-3"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={() => navigate('/tasks/create')}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>새 작업</span>
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* 검색바 */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="작업명, 설명으로 검색..."
                value={filters.search}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>필터</span>
            </Button>

            {/* 빠른 필터 */}
            <Button
              variant={filters.assignee_id === user?.id?.toString() ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('assignee_id',
                filters.assignee_id === user?.id?.toString() ? '' : user?.id?.toString() || ''
              )}
            >
              내 작업
            </Button>

            <Button
              variant={filters.is_overdue === 'true' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('is_overdue',
                filters.is_overdue === 'true' ? '' : 'true'
              )}
            >
              지연된 작업
            </Button>

            {Object.values(filters).some(value => value !== '' && value !== 'updated_at' && value !== 'desc') && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="flex items-center space-x-2 text-gray-500"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>초기화</span>
              </Button>
            )}
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="grid md:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* 프로젝트 필터 */}
              <div>
                <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  프로젝트
                </label>
                <select
                  id="project-select"
                  aria-label="프로젝트"
                  value={filters.project_id}
                  onChange={(e) => handleFilterChange('project_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  disabled={projectsLoading}
                >
                  <option value="">모든 프로젝트</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 상태 필터 */}
              <div>
                <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태
                </label>
                <select
                  id="status-select"
                  aria-label="상태"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="">모든 상태</option>
                  <option value="todo">할 일</option>
                  <option value="in_progress">진행 중</option>
                  <option value="in_review">검토 중</option>
                  <option value="done">완료</option>
                </select>
              </div>

              {/* 우선순위 필터 */}
              <div>
                <label htmlFor="priority-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  우선순위
                </label>
                <select
                  id="priority-select"
                  aria-label="우선순위"
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="">모든 우선순위</option>
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                  <option value="critical">긴급</option>
                </select>
              </div>

              {/* 타입 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  타입
                </label>
                <select
                  id="type-select"
                  aria-label="타입"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="">모든 타입</option>
                  <option value="task">작업</option>
                  <option value="bug">버그</option>
                  <option value="feature">기능</option>
                  <option value="improvement">개선</option>
                  <option value="research">연구</option>
                </select>
              </div>

              {/* 정렬 기준 */}
              <div>
                <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  정렬 기준
                </label>
                <select
                  id="sort-select"
                  value={`${filters.sort_by}_${filters.sort_order}`}
                  onChange={(e) => {
                    const [sort_by, sort_order] = e.target.value.split('_');
                    handleFilterChange('sort_by', sort_by || '');
                    handleFilterChange('sort_order', sort_order || '');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="updated_at_desc">최근 수정순</option>
                  <option value="created_at_desc">최근 생성순</option>
                  <option value="due_date_asc">마감일 빠른순</option>
                  <option value="due_date_desc">마감일 늦은순</option>
                  <option value="priority_desc">우선순위 높은순</option>
                  <option value="title_asc">제목 오름차순</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 결과 요약 */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          총 {totalItems.toLocaleString()}개의 작업
          {filters.search && ` • "${filters.search}" 검색 결과`}
        </div>
        <div>
          {totalPages > 1 && `${currentPage} / ${totalPages} 페이지`}
        </div>
      </div>

      {/* 작업 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div
                className="flex items-center justify-between"
                onClick={() => navigate(`/tasks/${task.id}`)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/tasks/${task.id}`);
                  }
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </h3>

                    {/* 배지들 */}
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityText(task.priority)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(task.type)}`}>
                        {getTypeText(task.type)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    {/* 프로젝트 */}
                    <span className="flex items-center space-x-1">
                      <span>📁</span>
                      <span>{task.project.name}</span>
                    </span>

                    {/* 담당자 */}
                    {task.assignees.length > 0 && (
                      <span className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>
                          {task.assignees.length === 1
                            ? task.assignees[0]?.user?.full_name ?? ''
                            : `${task.assignees[0]?.user?.full_name ?? ''} 외 ${task.assignees.length - 1}명`
                          }
                        </span>
                      </span>
                    )}

                    {/* 마감일 */}
                    {task.due_date && (
                      <span className={`flex items-center space-x-1 ${getDueDateColor(task.due_date)}`}>
                        <CalendarIcon className="h-3 w-3" />
                        <span>{getDaysUntilDue(task.due_date)}</span>
                      </span>
                    )}

                    {/* 생성일 */}
                    <span className="flex items-center space-x-1">
                      <ClockIcon className="h-3 w-3" />
                      <span>{formatDate(task.created_at)}</span>
                    </span>

                    {/* 태그 */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {task.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {tag.name}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-xs">+{task.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* 우선순위 표시 */}
                  {task.priority === 'critical' && (
                    <FlagIcon className="h-4 w-4 text-red-500" />
                  )}
                  {task.priority === 'high' && (
                    <FlagIcon className="h-4 w-4 text-orange-500" />
                  )}

                  {/* 담당자 아바타 */}
                  {task.assignees.length > 0 && (
                    <div className="flex -space-x-1">
                      {task.assignees.slice(0, 3).map((assignee) => (
                        <div key={assignee.id} className="relative">
                          {assignee.user.avatar_url ? (
                            <img
                              src={assignee.user.avatar_url}
                              alt={assignee.user.full_name}
                              className="h-6 w-6 rounded-full border-2 border-white dark:border-gray-800"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                {assignee.user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="h-6 w-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            +{task.assignees.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Prevent event bubbling by using event.stopPropagation in the parent div's onClick if needed
                      navigate(`/tasks/${task.id}`);
                    }}
                    className="p-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>

                  {isTaskAssignee(task) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Prevent event bubbling by using event.stopPropagation in the parent div's onClick if needed
                        navigate(`/tasks/${task.id}/edit`);
                      }}
                      className="p-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <div className="h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FunnelIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              작업을 찾을 수 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {Object.values(filters).some(value => value !== '' && value !== 'updated_at' && value !== 'desc')
                ? '검색 조건을 변경하거나 필터를 초기화해보세요.'
                : '아직 작업이 없습니다. 첫 번째 작업을 만들어보세요.'}
            </p>
            <div className="flex justify-center space-x-3">
              {Object.values(filters).some(value => value !== '' && value !== 'updated_at' && value !== 'desc') && (
                <Button variant="outline" onClick={clearFilters}>
                  필터 초기화
                </Button>
              )}
              <Button onClick={() => navigate('/tasks/create')}>
                새 작업 만들기
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              이전
            </Button>

            {/* 페이지 번호 */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNo: number = 1;
                if (totalPages <= 5) {
                  pageNo = i + 1;
                } else if (currentPage <= 3) {
                  pageNo = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNo = totalPages - 4 + i;
                } else {
                  pageNo = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNo}
                    variant={currentPage === pageNo ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNo)}
                    className="w-10"
                  >
                    {pageNo}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
