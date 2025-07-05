// ============================================================================
// Calendar.tsx - 메인 캘린더 페이지
// ============================================================================

import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ListBulletIcon,
  PlusIcon,
  Squares2X2Icon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCalendar } from '@/hooks/use-calendar';
import type { CalendarEvent } from '@/types/calendar';

type ViewMode = 'month' | 'week' | 'day' | 'list';

interface CalendarFilters {
  search: string;
  status: string;
  priority: string;
}

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const {
    isLoadingEvents,
    eventsError,
    useEventsInRange,
    refetchEvents,
  } = useCalendar();

  // 상태 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  // const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    search: '',
    status: '',
    priority: '',
  });

  // 현재 뷰에서 표시할 날짜 범위 계산
  const getViewStartDate = (): string => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        date.setDate(1);
        date.setDate(date.getDate() - date.getDay());
        break;
      case 'week':
        date.setDate(date.getDate() - date.getDay());
        break;
      case 'day':
        break;
      case 'list':
        date.setDate(1);
        break;
    }
    return date.toISOString().split('T')[0] ?? '';
  };

  const getViewEndDate = (): string => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        date.setDate(date.getDate() + (6 - date.getDay()));
        break;
      case 'week':
        date.setDate(date.getDate() + 6);
        break;
      case 'day':
        break;
      case 'list':
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        break;
    }
    return date.toISOString().split('T')[0] ?? '';
  };

  // 특정 기간의 이벤트 데이터 조회
  const {
    data: rangeEvents = [],
    isLoading: isLoadingRangeEvents,
    error: rangeEventsError,
  } = useEventsInRange(getViewStartDate(), getViewEndDate());

  // 날짜 네비게이션
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'list':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  // 현재 날짜로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 날짜 타이틀 포맷팅
  const getDateTitle = () => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        return date.toLocaleString('ko-KR', { year: 'numeric', month: 'long' });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('ko-KR')} - ${weekEnd.toLocaleDateString('ko-KR')}`;
      case 'day':
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
      case 'list':
        return date.toLocaleString('ko-KR', { year: 'numeric', month: 'long' });
      default:
        return '';
    }
  };

  // 이벤트 상태에 따른 배지 색상
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // 우선순위에 따른 배지 색상
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // 월 뷰 렌더링
  const renderMonthView = () => {
    const startDate = new Date(getViewStartDate());
    const days = [];

    // 요일 헤더
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 6주 * 7일 = 42일 그리드 생성
    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      const dayEvents = rangeEvents.filter((event: CalendarEvent) => {
        const eventDate = new Date(event.start_date);
        return eventDate.toDateString() === currentDate.toDateString();
      });

      days.push(
        <div
          key={i}
          className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 ${
            currentDate.getMonth() !== new Date().getMonth()
              ? 'bg-gray-50 dark:bg-gray-800'
              : 'bg-white dark:bg-gray-900'
          } hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer`}
          onClick={() => navigate(`/calendar/events/new?date=${currentDate.toISOString().split('T')[0]}`)}
        >
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${
              currentDate.toDateString() === new Date().toDateString()
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-900 dark:text-white'
            }`}>
              {currentDate.getDate()}
            </span>
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event: CalendarEvent) => (
              <div
                key={event.id}
                className="text-xs p-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/calendar/events/${event.id}`);
                }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day) => (
            <div key={day} className="p-4 text-center font-medium text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>
        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  // 리스트 뷰 렌더링
  const renderListView = () => {
    const filteredEvents = rangeEvents.filter((event: CalendarEvent) => {
      if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && event.status !== filters.status) {
        return false;
      }
      if (filters.priority && event.priority !== filters.priority) {
        return false;
      }
      return true;
    });

    if (filteredEvents.length === 0) {
      return (
        <Card className="p-8 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            이벤트가 없습니다
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            새로운 이벤트를 생성해보세요.
          </p>
          <Button onClick={() => navigate('/calendar/events/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            새 이벤트
          </Button>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {filteredEvents.map((event: CalendarEvent) => (
          <Card key={event.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3
                    className="text-lg font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => navigate(`/calendar/events/${event.id}`)}
                  >
                    {event.title}
                  </h3>
                  <Badge className={getStatusBadgeColor(event.status)}>
                    {event.status.toUpperCase()}
                  </Badge>
                  <Badge className={getPriorityBadgeColor(event.priority)}>
                    {event.priority.toUpperCase()}
                  </Badge>
                </div>

                {event.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                    {event.description}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    시작: {new Date(event.start_date).toLocaleString('ko-KR')}
                  </span>
                  <span>
                    종료: {new Date(event.end_date).toLocaleString('ko-KR')}
                  </span>
                  {event.location && (
                    <span>위치: {event.location}</span>
                  )}
                </div>

                {event.attendees && event.attendees.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      참여자 {event.attendees.length}명
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/calendar/events/${event.id}/edit`)}
                >
                  수정
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // 로딩 상태
  if (isLoadingEvents || isLoadingRangeEvents) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 에러 상태
  if (eventsError || rangeEventsError) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorMessage
          message={eventsError?.message || rangeEventsError?.message || '데이터를 불러올 수 없습니다'}
          onRetry={refetchEvents}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            캘린더
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            일정과 이벤트를 관리하세요
          </p>
        </div>
        <Button onClick={() => navigate('/calendar/events/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          새 이벤트
        </Button>
      </div>

      {/* 캘린더 컨트롤 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={goToToday}
            >
              오늘
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getDateTitle()}
          </h2>
        </div>

        {/* 뷰 모드 토글 */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('month')}
              className={`rounded-none ${viewMode === 'month'
                ? 'bg-gray-100 dark:bg-gray-700'
                : ''}`}
            >
              <ViewColumnsIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('week')}
              className={`rounded-none ${viewMode === 'week'
                ? 'bg-gray-100 dark:bg-gray-700'
                : ''}`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-none ${viewMode === 'list'
                ? 'bg-gray-100 dark:bg-gray-700'
                : ''}`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 필터 */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                검색
              </label>
              <Input
                type="text"
                placeholder="이벤트 제목 검색..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                상태
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">모든 상태</option>
                <option value="confirmed">확정</option>
                <option value="tentative">미정</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                우선순위
              </label>
              <select
                aria-label="우선순위"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">모든 우선순위</option>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ search: '', status: '', priority: '' })}
                className="w-full"
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 캘린더 뷰 */}
      <div>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'list' && renderListView()}
        {(viewMode === 'week' || viewMode === 'day') && (
          <Card className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {viewMode === 'week' ? '주' : '일'} 뷰는 현재 개발 중입니다.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Calendar;
