import { calendarService } from '@/services/calendar-service';
import type {
    CalendarConflict,
    CalendarEvent,
    CalendarEventDisplay,
    DateRange,
    EventFilters
} from '@/types/calendar';
import { useQuery } from '@tanstack/react-query';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';

/**
 * 캘린더 이벤트 데이터 관리 및 필터링을 위한 커스텀 훅
 */
export const useCalendarEvents = (dateRange?: DateRange, initialFilters?: EventFilters) => {
  const [filters, setFilters] = useState<EventFilters>(initialFilters || {});
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // 이벤트 데이터 조회
  const {
    data: allEvents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['calendar', 'events', dateRange, filters],
    queryFn: () => {
      if (dateRange) {
        return calendarService.getEventsInRange(
          format(dateRange.start, 'yyyy-MM-dd'),
          format(dateRange.end, 'yyyy-MM-dd')
        );
      }
      return calendarService.getEvents(filters);
    },
    staleTime: 5 * 60 * 1000, // 5분
    enabled: !!(dateRange || Object.keys(filters).length > 0),
  });

  // 필터링된 이벤트들
  const filteredEvents = useMemo(() => {
    let events = allEvents;

    // 타입 필터
    if (filters.type && filters.type.length > 0) {
      events = events.filter(event => filters.type!.includes(event.type));
    }

    // 상태 필터
    if (filters.status && filters.status.length > 0) {
      events = events.filter(event => filters.status!.includes(event.status));
    }

    // 우선순위 필터
    if (filters.priority && filters.priority.length > 0) {
      events = events.filter(event => filters.priority!.includes(event.priority));
    }

    // 프로젝트 필터
    if (filters.project_id) {
      events = events.filter(event => event.project_id === filters.project_id);
    }

    // 작업 필터
    if (filters.task_id) {
      events = events.filter(event => event.task_id === filters.task_id);
    }

    // 참여자 필터
    if (filters.attendee_id) {
      events = events.filter((event: CalendarEvent) =>
        event.attendees?.some((attendee: { user_id: string }) => attendee.user_id === filters.attendee_id)
      );
    }

    // 생성자 필터
    if (filters.created_by) {
      events = events.filter(event => event.created_by === filters.created_by);
    }

    // 검색어 필터
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm) ||
        event.location?.toLowerCase().includes(searchTerm)
      );
    }

    // 가시성 필터
    if (filters.visibility) {
      events = events.filter(event => event.visibility === filters.visibility);
    }

    return events;
  }, [allEvents, filters]);

  // 표시용 이벤트 데이터 (추가 메타데이터 포함)
  const displayEvents = useMemo((): CalendarEventDisplay[] => {
    return filteredEvents.map(event => {
      const startDate = parseISO(event.start_date);
      const endDate = parseISO(event.end_date);
      const duration = endDate.getTime() - startDate.getTime();

      return {
        ...event,
        display_start: startDate,
        display_end: endDate,
        is_multiday: !event.all_day && format(startDate, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd'),
        duration_minutes: Math.round(duration / (1000 * 60)),
      };
    });
  }, [filteredEvents]);

  // 날짜별 이벤트 그룹화
  const eventsByDate = useMemo(() => {
    const grouped: { [date: string]: CalendarEventDisplay[] } = {};

    displayEvents.forEach(event => {
      const dateKey = format(event.display_start, 'yyyy-MM-dd');
      if (!Array.isArray(grouped[dateKey])) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // 각 날짜의 이벤트를 시간순으로 정렬
    Object.keys(grouped).forEach(date => {
      if (Array.isArray(grouped[date])) {
        grouped[date].sort((a, b) =>
          a.display_start.getTime() - b.display_start.getTime()
        );
      }
    });

    return grouped;
  }, [displayEvents]);

  // 이벤트 충돌 감지
  const detectConflicts = useCallback((targetEvent: CalendarEvent): CalendarConflict[] => {
    const conflicts: CalendarConflict[] = [];
    const targetStart = parseISO(targetEvent.start_date);
    const targetEnd = parseISO(targetEvent.end_date);

    filteredEvents.forEach(event => {
      if (event.id === targetEvent.id) return;

      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);

      // 시간 겹침 확인
      const hasOverlap = (
        (targetStart >= eventStart && targetStart < eventEnd) ||
        (targetEnd > eventStart && targetEnd <= eventEnd) ||
        (targetStart <= eventStart && targetEnd >= eventEnd)
      );

      if (hasOverlap) {
        const overlapStart = new Date(Math.max(targetStart.getTime(), eventStart.getTime()));
        const overlapEnd = new Date(Math.min(targetEnd.getTime(), eventEnd.getTime()));

        conflicts.push({
          event1: targetEvent,
          event2: event,
          overlap_start: overlapStart.toISOString(),
          overlap_end: overlapEnd.toISOString(),
          overlap_duration: Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60))
        });
      }
    });

    return conflicts;
  }, [filteredEvents]);

  // 특정 날짜의 이벤트 조회
  const getEventsForDate = useCallback((date: Date): CalendarEventDisplay[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  }, [eventsByDate]);

  // 특정 시간 범위의 이벤트 조회
  const getEventsInTimeRange = useCallback((start: Date, end: Date): CalendarEventDisplay[] => {
    return displayEvents.filter(event =>
      isWithinInterval(event.display_start, { start, end }) ||
      isWithinInterval(event.display_end, { start, end }) ||
      (event.display_start <= start && event.display_end >= end)
    );
  }, [displayEvents]);

  // 필터 업데이트
  const updateFilters = useCallback((newFilters: Partial<EventFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // 이벤트 선택 관리
  const selectEvent = useCallback((eventId: string) => {
    setSelectedEventIds(prev => [...prev, eventId]);
  }, []);

  const deselectEvent = useCallback((eventId: string) => {
    setSelectedEventIds(prev => prev.filter(id => id !== eventId));
  }, []);

  const toggleEventSelection = useCallback((eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedEventIds([]);
  }, []);

  const selectAllEvents = useCallback(() => {
    setSelectedEventIds(displayEvents.map(event => event.id));
  }, [displayEvents]);

  // 통계 계산
  const statistics = useMemo(() => {
    const total = displayEvents.length;
    const byType = displayEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = displayEvents.reduce((acc, event) => {
      acc[event.priority] = (acc[event.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalDuration = displayEvents.reduce((acc, event) =>
      acc + event.duration_minutes, 0
    );

    return {
      total,
      byType,
      byPriority,
      totalDuration,
      averageDuration: total > 0 ? Math.round(totalDuration / total) : 0,
    };
  }, [displayEvents]);

  return {
    // 데이터
    allEvents,
    filteredEvents,
    displayEvents,
    eventsByDate,
    selectedEventIds,

    // 상태
    isLoading,
    error,
    filters,
    statistics,

    // 액션
    updateFilters,
    clearFilters,
    refetch,

    // 선택 관리
    selectEvent,
    deselectEvent,
    toggleEventSelection,
    clearSelection,
    selectAllEvents,

    // 유틸리티
    getEventsForDate,
    getEventsInTimeRange,
    detectConflicts,

    // 계산된 값
    hasEvents: displayEvents.length > 0,
    hasFilters: Object.keys(filters).length > 0,
    selectedEvents: displayEvents.filter(event => selectedEventIds.includes(event.id)),
  };
};
