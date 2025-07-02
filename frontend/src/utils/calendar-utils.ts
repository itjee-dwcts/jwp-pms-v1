import type { CalendarEvent, DateRange, RecurrenceRule } from '@/types/calendar';
import { addDays, format, isWithinInterval, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 캘린더 관련 유틸리티 함수들
 */

// ============================================================================
// 날짜 포맷팅 함수들
// ============================================================================

export const formatEventDate = (date: string | Date, formatStr: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ko });
};

export const formatEventTime = (date: string | Date, use24Hour: boolean = true): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const formatStr = use24Hour ? 'HH:mm' : 'h:mm a';
  return format(dateObj, formatStr, { locale: ko });
};

export const formatEventDateTime = (date: string | Date, use24Hour: boolean = true): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const formatStr = use24Hour ? 'PPP HH:mm' : 'PPP h:mm a';
  return format(dateObj, formatStr, { locale: ko });
};

export const formatDateRange = (start: string | Date, end: string | Date): string => {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;

  const startFormatted = format(startDate, 'M월 d일 HH:mm', { locale: ko });
  const endFormatted = format(endDate, 'HH:mm', { locale: ko });

  // 같은 날인지 확인
  if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
    return `${startFormatted} - ${endFormatted}`;
  } else {
    const endDateFormatted = format(endDate, 'M월 d일 HH:mm', { locale: ko });
    return `${startFormatted} - ${endDateFormatted}`;
  }
};

// ============================================================================
// 이벤트 처리 함수들
// ============================================================================

export const isEventToday = (event: CalendarEvent): boolean => {
  const today = new Date();
  const eventStart = parseISO(event.start_date);
  return format(eventStart, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
};

export const isEventUpcoming = (event: CalendarEvent, daysAhead: number = 7): boolean => {
  const now = new Date();
  const eventStart = parseISO(event.start_date);
  const endRange = addDays(now, daysAhead);

  return eventStart >= now && eventStart <= endRange;
};

export const isEventOverdue = (event: CalendarEvent): boolean => {
  const now = new Date();
  const eventEnd = parseISO(event.end_date);
  return eventEnd < now;
};

export const getEventDuration = (event: CalendarEvent): number => {
  const start = parseISO(event.start_date);
  const end = parseISO(event.end_date);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
};

export const isEventAllDay = (event: CalendarEvent): boolean => {
  return event.all_day;
};

export const isEventMultiDay = (event: CalendarEvent): boolean => {
  const start = parseISO(event.start_date);
  const end = parseISO(event.end_date);
  return format(start, 'yyyy-MM-dd') !== format(end, 'yyyy-MM-dd');
};

// ============================================================================
// 이벤트 충돌 및 겹침 처리
// ============================================================================

export const doEventsOverlap = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
  const start1 = parseISO(event1.start_date);
  const end1 = parseISO(event1.end_date);
  const start2 = parseISO(event2.start_date);
  const end2 = parseISO(event2.end_date);

  return (
    (start1 < end2 && end1 > start2) ||
    (start2 < end1 && end2 > start1)
  );
};

export const findEventConflicts = (events: CalendarEvent[]): CalendarEvent[][] => {
  const conflicts: CalendarEvent[][] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (events[i] && events[j] && doEventsOverlap(events[i]!, events[j]!)) {
        const existingGroup = conflicts.find(group =>
          group.includes(events[i]!) || group.includes(events[j]!)
        );

        if (existingGroup) {
          if (!existingGroup.includes(events[i]!)) existingGroup.push(events[i]!);
          if (!existingGroup.includes(events[j]!)) existingGroup.push(events[j]!);
        } else {
          conflicts.push([events[i]!, events[j]!]);
        }
      }
    }
  }

  return conflicts;
};

// ============================================================================
// 이벤트 필터링 및 정렬
// ============================================================================

export const filterEventsByDateRange = (
  events: CalendarEvent[],
  dateRange: DateRange
): CalendarEvent[] => {
  return events.filter(event => {
    const eventStart = parseISO(event.start_date);
    const eventEnd = parseISO(event.end_date);

    return isWithinInterval(eventStart, dateRange) ||
           isWithinInterval(eventEnd, dateRange) ||
           (eventStart <= dateRange.start && eventEnd >= dateRange.end);
  });
};

export const sortEventsByDateTime = (events: CalendarEvent[]): CalendarEvent[] => {
  return [...events].sort((a, b) => {
    const startA = parseISO(a.start_date);
    const startB = parseISO(b.start_date);

    if (startA.getTime() === startB.getTime()) {
      // 시작 시간이 같으면 종료 시간으로 정렬
      const endA = parseISO(a.end_date);
      const endB = parseISO(b.end_date);
      return endA.getTime() - endB.getTime();
    }

    return startA.getTime() - startB.getTime();
  });
};

export const groupEventsByDate = (events: CalendarEvent[]): Record<string, CalendarEvent[]> => {
  const grouped: Record<string, CalendarEvent[]> = {};

  events.forEach(event => {
    const dateKey = format(parseISO(event.start_date), 'yyyy-MM-dd');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });

  // 각 날짜의 이벤트들을 시간순으로 정렬
  Object.keys(grouped).forEach(date => {
    if (Array.isArray(grouped[date])) {
      grouped[date] = sortEventsByDateTime(grouped[date]);
    }
  });

  return grouped;
};

// ============================================================================
// 반복 이벤트 처리
// ============================================================================

export const parseRecurrenceRule = (rule: string): RecurrenceRule | null => {
  try {
    // 입력값 검증
    if (!rule || typeof rule !== 'string') {
      return null;
    }

    // RRULE 파싱 로직 (간단한 버전)
    const parts = rule.split(';').filter(part => part.trim()); // 빈 문자열 제거
    const ruleObj: Partial<RecurrenceRule> = {};

    parts.forEach(part => {
      const [key, value] = part.split('=');

      // key와 value가 모두 존재하는지 확인
      if (!key || value === undefined || value === '') {
        return; // 이 반복을 건너뜀
      }

      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      switch (trimmedKey) {
        case 'FREQ':
          const frequency = trimmedValue.toLowerCase();
          if (['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
            ruleObj.frequency = frequency as RecurrenceRule['frequency'];
          }
          break;
        case 'INTERVAL':
          const interval = parseInt(trimmedValue, 10);
          if (!isNaN(interval) && interval > 0) {
            ruleObj.interval = interval;
          }
          break;
        case 'COUNT':
          const count = parseInt(trimmedValue, 10);
          if (!isNaN(count) && count > 0) {
            ruleObj.count = count;
          }
          break;
        case 'UNTIL':
          if (trimmedValue) {
            ruleObj.until = trimmedValue;
          }
          break;
        case 'BYDAY':
          if (trimmedValue) {
            const byDays = trimmedValue.split(',')
              .map(day => day.trim())
              .filter(day => day.length > 0);
            if (byDays.length > 0) {
              ruleObj.by_day = byDays;
            }
          }
          break;
        case 'BYMONTHDAY':
          if (trimmedValue) {
            const monthDays = trimmedValue.split(',')
              .map(day => parseInt(day.trim(), 10))
              .filter(day => !isNaN(day) && day >= 1 && day <= 31);
            if (monthDays.length > 0) {
              ruleObj.by_month_day = monthDays;
            }
          }
          break;
        case 'BYMONTH':
          if (trimmedValue) {
            const months = trimmedValue.split(',')
              .map(month => parseInt(month.trim(), 10))
              .filter(month => !isNaN(month) && month >= 1 && month <= 12);
            if (months.length > 0) {
              ruleObj.by_month = months;
            }
          }
          break;
        case 'BYYEARDAY':
          if (trimmedValue) {
            const yearDays = trimmedValue.split(',')
              .map(day => parseInt(day.trim(), 10))
              .filter(day => !isNaN(day) && day >= 1 && day <= 366);
            if (yearDays.length > 0) {
              ruleObj.by_year_day = yearDays;
            }
          }
          break;
        // 다른 규칙들도 필요에 따라 추가
        default:
          // 알 수 없는 규칙은 무시
          break;
      }
    });

    // 최소한 frequency가 있어야 유효한 규칙
    if (!ruleObj.frequency) {
      return null;
    }

    return ruleObj as RecurrenceRule;
  } catch (error) {
    console.error('Failed to parse recurrence rule:', error);
    return null;
  }
};

export const generateRecurrenceText = (rule: RecurrenceRule): string => {
  const { frequency, interval = 1, count, until } = rule;

  let text = '';

  if (interval === 1) {
    switch (frequency) {
      case 'daily':
        text = '매일';
        break;
      case 'weekly':
        text = '매주';
        break;
      case 'monthly':
        text = '매월';
        break;
      case 'yearly':
        text = '매년';
        break;
    }
  } else {
    switch (frequency) {
      case 'daily':
        text = `${interval}일마다`;
        break;
      case 'weekly':
        text = `${interval}주마다`;
        break;
      case 'monthly':
        text = `${interval}개월마다`;
        break;
      case 'yearly':
        text = `${interval}년마다`;
        break;
    }
  }

  if (count) {
    text += ` (${count}회)`;
  } else if (until) {
    const untilDate = parseISO(until);
    text += ` (${format(untilDate, 'yyyy년 M월 d일')}까지)`;
  }

  return text;
};

// ============================================================================
// 색상 및 스타일 유틸리티
// ============================================================================

export const getEventTypeColor = (type: CalendarEvent['type']): string => {
  const colors = {
    meeting: '#3B82F6',     // blue
    task: '#8B5CF6',        // purple
    reminder: '#10B981',    // green
    deadline: '#EF4444',    // red
    holiday: '#F59E0B',     // yellow
    personal: '#6B7280',    // gray
  };

  return colors[type] || colors.personal;
};

export const getEventPriorityColor = (priority: CalendarEvent['priority']): string => {
  const colors = {
    low: '#10B981',      // green
    medium: '#F59E0B',   // yellow
    high: '#EF4444',     // red
    urgent: '#DC2626',   // dark red
  };

  return colors[priority] || colors.medium;
};

export const getEventStatusIcon = (status: CalendarEvent['status']): string => {
  const icons = {
    tentative: '❓',
    confirmed: '✅',
    cancelled: '❌',
  };

  return icons[status] || icons.tentative;
};

// ============================================================================
// 시간대 처리
// ============================================================================

export const convertToTimezone = (date: string | Date, timezone: string): Date => {
  // 실제 구현에서는 date-fns-tz 등의 라이브러리 사용 권장
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  // 간단한 UTC 변환 (실제로는 더 복잡한 로직 필요)
  return dateObj;
};

export const formatTimeInTimezone = (
  date: string | Date,
  timezone: string,
  formatStr: string = 'PPP HH:mm'
): string => {
  const convertedDate = convertToTimezone(date, timezone);
  return format(convertedDate, formatStr, { locale: ko });
};

// ============================================================================
// 내보내기/가져오기 유틸리티
// ============================================================================

export const exportToICS = (events: CalendarEvent[]): string => {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PMS//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach(event => {
    const startDate = parseISO(event.start_date);
    const endDate = parseISO(event.end_date);

    icsContent = icsContent.concat([
      'BEGIN:VEVENT',
      `UID:${event.id}@pms.local`,
      `DTSTART:${format(startDate, "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTEND:${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      `STATUS:${event.status.toUpperCase()}`,
      `PRIORITY:${getPriorityNumber(event.priority)}`,
      `CREATED:${format(parseISO(event.created_at), "yyyyMMdd'T'HHmmss'Z'")}`,
      `LAST-MODIFIED:${format(parseISO(event.updated_at), "yyyyMMdd'T'HHmmss'Z'")}`,
      'END:VEVENT'
    ]);
  });

  icsContent.push('END:VCALENDAR');

  return icsContent.join('\r\n');
};

const getPriorityNumber = (priority: CalendarEvent['priority']): number => {
  const priorities = {
    low: 9,
    medium: 5,
    high: 3,
    urgent: 1
  };

  return priorities[priority] || 5;
};

// ============================================================================
// 검색 및 필터링 유틸리티
// ============================================================================

export const searchEvents = (events: CalendarEvent[], query: string): CalendarEvent[] => {
  if (!query.trim()) return events;

  const searchTerm = query.toLowerCase();

  return events.filter(event =>
    event.title.toLowerCase().includes(searchTerm) ||
    event.description?.toLowerCase().includes(searchTerm) ||
    event.location?.toLowerCase().includes(searchTerm) ||
    event.attendees?.some(attendee =>
      attendee.user.full_name.toLowerCase().includes(searchTerm) ||
      attendee.user.email.toLowerCase().includes(searchTerm)
    )
  );
};

export const getUpcomingEvents = (
  events: CalendarEvent[],
  daysAhead: number = 7
): CalendarEvent[] => {
  const now = new Date();
  const endDate = addDays(now, daysAhead);

  return events
    .filter(event => {
      const eventStart = parseISO(event.start_date);
      return eventStart >= now && eventStart <= endDate;
    })
    .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime());
};

export const getOverdueEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const now = new Date();

  return events
    .filter(event => {
      const eventEnd = parseISO(event.end_date);
      return eventEnd < now && event.status !== 'cancelled';
    })
    .sort((a, b) => parseISO(b.end_date).getTime() - parseISO(a.end_date).getTime());
};
