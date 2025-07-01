import {
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentIcon,
    ExclamationCircleIcon,
    FolderIcon,
    FunnelIcon,
    InformationCircleIcon,
    MagnifyingGlassIcon,
    TagIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// 타입 정의
interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'user' | 'event';
  title: string;
  description?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  tags?: string[];
  assignees?: string[];
  projectName?: string;
}

interface SearchFilters {
  type: string;
  status: string;
  priority: string;
  dateRange: string;
}

// 더미 검색 결과 데이터
const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'project',
    title: '신규 웹사이트 개발',
    description: 'React와 TypeScript를 사용한 현대적인 웹사이트 구축',
    status: 'active',
    priority: 'high',
    dueDate: '2025-08-15',
    createdAt: '2025-01-15',
    updatedAt: '2025-07-01',
    url: '/projects/1',
    tags: ['react', 'typescript', 'web'],
  },
  {
    id: '2',
    type: 'task',
    title: 'API 문서 작성',
    description: 'REST API 엔드포인트 문서화 및 예제 코드 작성',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2025-07-10',
    createdAt: '2025-06-20',
    updatedAt: '2025-07-01',
    url: '/tasks/2',
    tags: ['documentation', 'api'],
    assignees: ['김개발', '이백엔드'],
    projectName: '신규 웹사이트 개발',
  },
  {
    id: '3',
    type: 'user',
    title: '김프론트',
    description: '프론트엔드 개발자',
    status: 'active',
    createdAt: '2025-01-10',
    updatedAt: '2025-06-30',
    url: '/users/3',
    tags: ['frontend', 'react', 'ui/ux'],
  },
  {
    id: '4',
    type: 'event',
    title: '스프린트 회고 미팅',
    description: '이번 스프린트의 성과와 개선점 논의',
    status: 'scheduled',
    priority: 'medium',
    dueDate: '2025-07-05',
    createdAt: '2025-06-25',
    updatedAt: '2025-06-28',
    url: '/calendar',
    tags: ['meeting', 'retrospective'],
  },
  {
    id: '5',
    type: 'task',
    title: '사용자 인증 구현',
    description: 'JWT 토큰 기반 로그인/로그아웃 기능 개발',
    status: 'completed',
    priority: 'high',
    dueDate: '2025-06-30',
    createdAt: '2025-06-10',
    updatedAt: '2025-06-29',
    url: '/tasks/5',
    tags: ['authentication', 'security', 'jwt'],
    assignees: ['김백엔드'],
    projectName: '신규 웹사이트 개발',
  },
];

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: searchParams.get('type') || 'all',
    status: searchParams.get('status') || 'all',
    priority: searchParams.get('priority') || 'all',
    dateRange: searchParams.get('dateRange') || 'all',
  });

  // 검색 결과 필터링
  const filteredResults = useMemo(() => {
    let results = mockSearchResults;

    // 검색어 필터링
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
      );
    }

    // 타입 필터링
    if (filters.type !== 'all') {
      results = results.filter((item) => item.type === filters.type);
    }

    // 상태 필터링
    if (filters.status !== 'all') {
      results = results.filter((item) => item.status === filters.status);
    }

    // 우선순위 필터링
    if (filters.priority !== 'all') {
      results = results.filter((item) => item.priority === filters.priority);
    }

    return results;
  }, [query, filters]);

  // URL 파라미터 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.priority !== 'all') params.set('priority', filters.priority);
    if (filters.dateRange !== 'all') params.set('dateRange', filters.dateRange);

    setSearchParams(params);
  }, [query, filters, setSearchParams]);

  // 검색 실행
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);

    // 실제 API 호출 시뮬레이션
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // 필터 변경
  const handleFilterChange = (filterType: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // 검색 결과 아이콘 선택
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project':
        return FolderIcon;
      case 'task':
        return CheckCircleIcon;
      case 'user':
        return UserIcon;
      case 'event':
        return CalendarIcon;
      default:
        return DocumentIcon;
    }
  };

  // 우선순위 색상 선택
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  // 상태 색상 선택
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'scheduled':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">통합 검색</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          프로젝트, 작업, 사용자, 이벤트를 검색하세요
        </p>
      </div>

      {/* 검색 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* 검색 입력 */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="검색어를 입력하세요..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
          />
        </div>

        {/* 필터 토글 버튼 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>필터</span>
          </button>

          {query && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? '검색 중...' : `${filteredResults.length}개의 결과`}
            </div>
          )}
        </div>

        {/* 필터 섹션 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 타입 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  타입
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">전체</option>
                  <option value="project">프로젝트</option>
                  <option value="task">작업</option>
                  <option value="user">사용자</option>
                  <option value="event">이벤트</option>
                </select>
              </div>

              {/* 상태 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">전체</option>
                  <option value="active">활성</option>
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="scheduled">예정</option>
                </select>
              </div>

              {/* 우선순위 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  우선순위
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">전체</option>
                  <option value="critical">긴급</option>
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="low">낮음</option>
                </select>
              </div>

              {/* 날짜 범위 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  날짜 범위
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">전체</option>
                  <option value="today">오늘</option>
                  <option value="week">이번 주</option>
                  <option value="month">이번 달</option>
                  <option value="year">올해</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredResults.length > 0 ? (
          filteredResults.map((result) => {
            const IconComponent = getResultIcon(result.type);
            return (
              <Link
                key={result.id}
                to={result.url}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start space-x-4">
                  {/* 아이콘 */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>

                  {/* 콘텐츠 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.status || '')}`}>
                        {result.status === 'active' && '활성'}
                        {result.status === 'in_progress' && '진행중'}
                        {result.status === 'completed' && '완료'}
                        {result.status === 'scheduled' && '예정'}
                        {result.status && !['active', 'in_progress', 'completed', 'scheduled'].includes(result.status) && result.status}
                      </span>
                      {result.priority && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(result.priority)}`}>
                          {result.priority === 'critical' && '긴급'}
                          {result.priority === 'high' && '높음'}
                          {result.priority === 'medium' && '보통'}
                          {result.priority === 'low' && '낮음'}
                        </span>
                      )}
                    </div>

                    {result.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {result.description}
                      </p>
                    )}

                    {/* 메타 정보 */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <DocumentIcon className="h-4 w-4" />
                        <span className="capitalize">{result.type}</span>
                      </div>

                      {result.projectName && (
                        <div className="flex items-center space-x-1">
                          <FolderIcon className="h-4 w-4" />
                          <span>{result.projectName}</span>
                        </div>
                      )}

                      {result.dueDate && (
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{new Date(result.dueDate).toLocaleDateString('ko-KR')}</span>
                        </div>
                      )}

                      {result.assignees && result.assignees.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <UserIcon className="h-4 w-4" />
                          <span>{result.assignees.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* 태그 */}
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <TagIcon className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {result.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : query ? (
          // 검색 결과 없음
          <div className="text-center py-12">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              검색 결과가 없습니다
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              다른 검색어나 필터를 사용해보세요.
            </p>
          </div>
        ) : (
          // 초기 상태
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              검색을 시작하세요
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              프로젝트, 작업, 사용자, 이벤트를 찾을 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* 검색 팁 */}
      {!query && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                검색 팁
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>프로젝트나 작업 이름으로 검색할 수 있습니다</li>
                  <li>태그를 사용하여 관련된 항목을 찾을 수 있습니다</li>
                  <li>필터를 사용하여 검색 결과를 좁힐 수 있습니다</li>
                  <li>사용자 이름이나 이메일로 팀 멤버를 찾을 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
