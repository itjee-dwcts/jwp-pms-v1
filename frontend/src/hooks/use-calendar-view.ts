import type { CalendarEvent, CalendarView, CalendarViewConfig, DateRange } from '@/types/calendar';
import { addDays, addMonths, addWeeks, addYears, endOfMonth, endOfWeek, endOfYear, format, startOfMonth, startOfWeek, startOfYear, subDays, subMonths, subWeeks, subYears } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';

/**
 * 캘린더 뷰 상태 및 네비게이션을 관리하는 커스텀 훅
 */
export const useCalendarView = (initialConfig?: Partial<CalendarViewConfig>) => {
  // 기본 설정
  const defaultConfig: CalendarViewConfig = {
    view: 'month',
    date: new Date(),
    showWeekends: true,
    showAllDay: true,
    timeFormat: '24h',
    firstDayOfWeek: 1, // Monday
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    slotDuration: 30,
    showTimeGrid: true,
    ...initialConfig
  };

  const [config, setConfig] = useState<CalendarViewConfig>(defaultConfig);

  // 현재 보기 범위 계산
  const dateRange = useMemo((): DateRange => {
    const { view, date, firstDayOfWeek } = config;

    switch (view) {
      case 'day':
        return {
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
        };

      case 'week':
        const weekStart = startOfWeek(date, { weekStartsOn: firstDayOfWeek });
        const weekEnd = endOfWeek(date, { weekStartsOn: firstDayOfWeek });
        return { start: weekStart, end: weekEnd };

      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        };

      case 'year':
        return {
          start: startOfYear(date),
          end: endOfYear(date)
        };

      case 'agenda':
        // 아젠다 뷰는 현재 날짜부터 30일
        return {
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          end: addDays(date, 30)
        };

      default:
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        };
    }
  }, [config.view, config.date, config.firstDayOfWeek]);

  // 표시할 날짜 범위 (캘린더 그리드용 - 이전/다음 달 일부 포함)
  const displayRange = useMemo((): DateRange => {
    const { view, date, firstDayOfWeek } = config;

    if (view === 'month') {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      return {
        start: startOfWeek(monthStart, { weekStartsOn: firstDayOfWeek }),
        end: endOfWeek(monthEnd, { weekStartsOn: firstDayOfWeek })
      };
    }

    return dateRange;
  }, [config.view, config.date, config.firstDayOfWeek, dateRange]);

  // 뷰 변경
  const changeView = useCallback((view: CalendarView) => {
    setConfig(prev => ({ ...prev, view }));
  }, []);

  // 날짜 변경
  const changeDate = useCallback((date: Date) => {
    setConfig(prev => ({ ...prev, date }));
  }, []);

  // 네비게이션
  const goToNext = useCallback(() => {
    setConfig(prev => {
      const { view, date } = prev;
      let newDate: Date;

      switch (view) {
        case 'day':
          newDate = addDays(date, 1);
          break;
        case 'week':
          newDate = addWeeks(date, 1);
          break;
        case 'month':
          newDate = addMonths(date, 1);
          break;
        case 'year':
          newDate = addYears(date, 1);
          break;
        case 'agenda':
          newDate = subDays(date, 7);
          break;
        default:
          newDate = subMonths(date, 1);
      }

      return { ...prev, date: newDate };
    });
  }, []);

  const goToToday = useCallback(() => {
    setConfig(prev => ({ ...prev, date: new Date() }));
  }, []);

  // 설정 업데이트
  const updateConfig = useCallback((updates: Partial<CalendarViewConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // 이벤트 필터링 및 표시 유틸리티
  const filterEventsInRange = useCallback((events: CalendarEvent[]): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);

      // 이벤트가 현재 표시 범위와 겹치는지 확인
      return (
        (eventStart >= dateRange.start && eventStart <= dateRange.end) ||
        (eventEnd >= dateRange.start && eventEnd <= dateRange.end) ||
        (eventStart <= dateRange.start && eventEnd >= dateRange.end)
      );
    });
  }, [dateRange]);

  // 시간 슬롯 생성 (일/주 뷰용)
  const timeSlots = useMemo(() => {
    const slots = [];
    const { workingHours, slotDuration } = config;

    // 하루 24시간을 슬롯으로 나누기
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isWorkingHour = timeString >= workingHours.start && timeString <= workingHours.end;

        slots.push({
          time: timeString,
          hour,
          minute,
          isWorkingHour,
          label: formatTimeSlot(timeString, config.timeFormat)
        });
      }
    }

    return slots;
  }, [config.slotDuration, config.workingHours, config.timeFormat]);

  // 주간 날짜 배열 생성
  const weekDays = useMemo(() => {
    if (config.view !== 'week' && config.view !== 'day') return [];

    const days = [];
    const startDate = config.view === 'week'
      ? startOfWeek(config.date, { weekStartsOn: config.firstDayOfWeek })
      : config.date;

    const dayCount = config.view === 'week' ? 7 : 1;

    for (let i = 0; i < dayCount; i++) {
      const day = addDays(startDate, i);
      if (config.showWeekends || (day.getDay() !== 0 && day.getDay() !== 6)) {
        days.push(day);
      }
    }

    return days;
  }, [config.view, config.date, config.firstDayOfWeek, config.showWeekends]);

  // 월간 달력 그리드 생성
  const monthGrid = useMemo(() => {
    if (config.view !== 'month') return [];

    const weeks = [];
    const startDate = displayRange.start;

    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = addDays(startDate, week * 7 + day);
        const isCurrentMonth = date.getMonth() === config.date.getMonth();
        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        days.push({
          date,
          isCurrentMonth,
          isToday,
          isWeekend,
          dayNumber: date.getDate(),
          dateString: format(date, 'yyyy-MM-dd')
        });
      }
      weeks.push(days);

      // 다음 달로 넘어가면 중단
      if (days[6] && days[6].date > displayRange.end) break;
    }

    return weeks;
  }, [config.view, config.date, displayRange]);

  // 타이틀 생성
  const viewTitle = useMemo(() => {
    const { view, date } = config;

    switch (view) {
      case 'day':
        return format(date, 'yyyy년 M월 d일 EEEE');
      case 'week':
        const weekStart = startOfWeek(date, { weekStartsOn: config.firstDayOfWeek });
        const weekEnd = endOfWeek(date, { weekStartsOn: config.firstDayOfWeek });
        return `${format(weekStart, 'M월 d일')} - ${format(weekEnd, 'M월 d일, yyyy')}`;
      case 'month':
        return format(date, 'yyyy년 M월');
      case 'year':
        return format(date, 'yyyy년');
      case 'agenda':
        return `아젠다 - ${format(date, 'yyyy년 M월 d일')}부터`;
      default:
        return format(date, 'yyyy년 M월');
    }
  }, [config.view, config.date, config.firstDayOfWeek]);

  // 헬퍼 함수들
  function formatTimeSlot(time: string, format: '12h' | '24h'): string {
    if (format === '12h') {
        const [hours, minutes] = time.split(':').map(Number);
        if (typeof hours !== 'number' || isNaN(hours) || typeof minutes !== 'number' || isNaN(minutes)) {
        return time;
        }
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    return time;
  }

  // 이전으로 이동
  const goToPrevious = useCallback(() => {
    setConfig(prev => {
      const { view, date } = prev;
      let newDate: Date;

      switch (view) {
        case 'day':
          newDate = subDays(date, 1);
          break;
        case 'week':
          newDate = subWeeks(date, 1);
          break;
        case 'month':
          newDate = subMonths(date, 1);
          break;
        case 'year':
          newDate = subYears(date, 1);
          break;
        case 'agenda':
          newDate = subDays(date, 7);
          break;
        default:
          newDate = subMonths(date, 1);
      }

      return { ...prev, date: newDate };
    });
  }, []);

  return {
    // 현재 설정
    config,

    // 계산된 값들
    dateRange,
    displayRange,
    viewTitle,
    timeSlots,
    weekDays,
    monthGrid,

    // 액션들
    changeView,
    changeDate,
    goToNext,
    goToPrevious,
    goToToday,
    updateConfig,

    // 유틸리티
    filterEventsInRange,

    // 현재 상태 체크
    isToday: format(config.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
    canGoNext: true, // 필요에 따라 제한 로직 추가
    canGoPrevious: true, // 필요에 따라 제한 로직 추가
  };
};
