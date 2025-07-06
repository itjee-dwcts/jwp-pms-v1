import {
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  UserGroupIcon,
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
import {
  Project,
  ProjectListResponse,
  ProjectSearchParams,
} from '../../types/project';

// 정렬 필드 타입
//type SortField = 'name' | 'created_at' | 'updated_at' | 'status' | 'priority';

// 필터 인터페이스 (내부 상태 관리용)
interface ProjectFilters {
  search: string;
  status: string;
  priority: string;
  owner_id: string;
  tags: string[];
  sort_by: string;
  sort_order: string;
}

/**
 * 프로젝트 목록 페이지 컴포넌트
 * 모든 프로젝트를 검색, 필터링, 정렬하여 표시합니다.
 */
const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { getProjects } = useProjects();

  // 상태 관리
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [showFilters, setShowFilters] = useState(false);

  // 필터 상태
  const [filters, setFilters] = useState<ProjectFilters>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    owner_id: searchParams.get('owner_id') || '',
    tags: searchParams.getAll('tags') || [],
    sort_by: searchParams.get('sort_by') || 'updated_at',
    sort_order: searchParams.get('sort_order') || 'desc',
  });

  // 컴포넌트 마운트 시 프로젝트 목록 로드
  useEffect(() => {
    fetchProjects();
  }, [currentPage, filters]);

  // URL 파라미터 업데이트
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value.toString());
        }
      }
    });

    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }

    setSearchParams(params);
  }, [filters, currentPage, setSearchParams]);

  /**
   * 프로젝트 목록 가져오기
   */
  const fetchProjects = async () => {
    try {
      setLoading(true);

      const queryParams: ProjectSearchParams = {
        ...filters,
        page_no: currentPage,
        page_size: pageSize,
        ...(filters.owner_id && { owner_id: filters.owner_id.toString() }),
      };

      const response: ProjectListResponse = await getProjects(queryParams);
      setProjects(response.projects);
      setTotalItems(response.total_items);
    } catch (error) {
      console.error('프로젝트 목록 로드 실패:', error);
      toast.error('프로젝트 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터 변경 핸들러
   */
  const handleFilterChange = (field: keyof ProjectFilters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
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
      status: '',
      priority: '',
      owner_id: '',
      tags: [],
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
  const getStatusColor = (status: string) => {
    switch(status) {
      case "planning":
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case "active":
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case "on_hold":
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case "completed":
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case "cancelled":
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  /**
   * 우선순위별 색상 반환
   */
  const getPriorityColor = (priority: string) => {
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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
        return '알 수 없음';
    }
  };


  /**
   * 사용자가 프로젝트 멤버인지 확인
   */
  const isProjectMember = (project: Project) => {
    return project.owner.id === user?.id ||
           project.members?.some(member => member.id === user?.id);
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalItems / pageSize);

  function getStatusText(status: string): React.ReactNode {
    switch (status) {
      case 'planning':
        return '계획 중';
      case 'active':
        return '진행 중';
      case 'on_hold':
        return '대기';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return '알 수 없음';
    }
  }

  function getProgressPercentage(project: Project): React.ReactNode {
    if (!project.task_count || project.task_count === 0) return 0;
    const completed = project.completed_task_count ?? 0;
    const total = project.task_count;
    const percent = Math.round((completed / total) * 100);
    return percent;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            프로젝트
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            팀의 모든 프로젝트를 관리하세요
          </p>
        </div>

        <Button
          onClick={() => navigate('/projects/create')}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>새 프로젝트</span>
        </Button>
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
                placeholder="프로젝트명, 설명, 태그로 검색..."
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

            {(filters.status || filters.priority || filters.owner_id || filters.tags.length > 0) && (
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
            <div className="grid md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* 상태 필터 */}
              <div>
                <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태
                </label>
                <select
                  id="status-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="">모든 상태</option>
                  <option value="planning">계획 중</option>
                  <option value="active">진행 중</option>
                  <option value="on_hold">대기</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>

              {/* 우선순위 필터 */}
              <div>
                <label htmlFor="priority-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  우선순위
                </label>
                <select
                  id="priority-select"
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

              {/* 정렬 기준 */}
              <div>
                <label htmlFor="sortby-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  정렬 기준
                </label>
                <select
                  id="sortby-select"
                  value={`${filters.sort_by}_${filters.sort_order}`}
                  onChange={(e) => {
                    const [sort_by, sort_order] = e.target.value.split('_');
                    handleFilterChange('sort_by', sort_by ?? '');
                    handleFilterChange('sort_order', sort_order ?? '');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="updated_at_desc">최근 수정순</option>
                  <option value="created_at_desc">최근 생성순</option>
                  <option value="name_asc">이름 오름차순</option>
                  <option value="name_desc">이름 내림차순</option>
                  <option value="status_asc">상태순</option>
                  <option value="priority_desc">우선순위 높은순</option>
                </select>
              </div>

              {/* 내 프로젝트만 보기 */}
              <div>
                <label htmlFor="owner-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  소유자
                </label>
                <select
                  id="owner-select"
                  value={filters.owner_id}
                  onChange={(e) => handleFilterChange('owner_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="">모든 프로젝트</option>
                  <option value={user?.id?.toString()}>내 프로젝트만</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 결과 요약 */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          총 {totalItems.toLocaleString()}개의 프로젝트
          {filters.search && ` • "${filters.search}" 검색 결과`}
        </div>
        <div>
          {totalPages > 1 && `${currentPage} / ${totalPages} 페이지`}
        </div>
      </div>

      {/* 프로젝트 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {/* 프로젝트 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {project.name}
                  </h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                      {getPriorityText(project.priority)}
                    </span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                {isProjectMember(project) && (
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate(`/projects/${project.id}`);
                      }}
                      className="p-1"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate(`/projects/${project.id}/edit`);
                      }}
                      className="p-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* 프로젝트 설명 */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {project.description}
              </p>

              {/* 진행률 */}
              {project.task_count !== undefined && project.task_count > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>진행률</span>
                    <span>{getProgressPercentage(project)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(project)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{project.completed_task_count}개 완료</span>
                    <span>총 {project.task_count}개</span>
                  </div>
                </div>
              )}

              {/* 태그 */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      +{project.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* 프로젝트 정보 */}
              <div className="space-y-2">
                {/* 소유자 */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <UserIcon className="h-4 w-4" />
                  <span>{project.owner.full_name}</span>
                </div>

                {/* 팀원 수 */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{(project.members?.length ?? 0) + 1}명의 팀원</span>
                </div>

                {/* 날짜 정보 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{new Date(project.start_date).toLocaleDateString('ko-KR')}</span>
                  </div>

                  {project.end_date && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4" />
                      <span>{new Date(project.end_date).toLocaleDateString('ko-KR')}</span>
                    </div>
                  )}
                </div>

                {/* 예산 */}
                {project.budget && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    예산: ₩{project.budget.toLocaleString()}
                  </div>
                )}
              </div>

              {/* 최근 업데이트 */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(project.updated_at).toLocaleDateString('ko-KR')} 업데이트
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
              프로젝트를 찾을 수 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filters.search || filters.status || filters.priority || filters.owner_id || filters.tags.length > 0
                ? '검색 조건을 변경하거나 필터를 초기화해보세요.'
                : '아직 프로젝트가 없습니다. 첫 번째 프로젝트를 만들어보세요.'}
            </p>
            <div className="flex justify-center space-x-3">
              {(filters.search || filters.status || filters.priority || filters.owner_id || filters.tags.length > 0) && (
                <Button variant="outline" onClick={clearFilters}>
                  필터 초기화
                </Button>
              )}
              <Button onClick={() => navigate('/projects/create')}>
                새 프로젝트 만들기
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
                let pageNo = 1;
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

export default Projects;
