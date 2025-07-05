import type { CalendarEvent, DateRange, RecurrenceRule } from '@/types/calendar';

/**
 * 캘린더 관련 유틸리티 함수들 (네이티브 JavaScript Date 사용)
 */

// ============================================================================
// 날짜 파싱 및 변환 함수들
// ============================================================================

/**
 * 문자열을 Date 객체로 변환
 */
const parseDate = (date: string | Date): Date => {
  if (typeof date === 'string') {
    return new Date(date);
  }
  return date;
};

/**
 * 날짜에 일수 더하기
 */
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * 날짜 포맷팅 (한국어 형식)
 */
const formatDate = (date: Date, formatType: 'date' | 'time' | 'datetime' | 'custom' = 'date', customFormat?: string): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // 숫자를 2자리로 패딩
  const pad = (num: number): string => num.toString().padStart(2, '0');

  switch (formatType) {
    case 'date':
      return `${year}-${pad(month)}-${pad(day)}`;
    case 'time':
      return `${pad(hours)}:${pad(minutes)}`;
    case 'datetime':
      return `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}`;
    case 'custom':
      if (customFormat) {
        return customFormat
          .replace('yyyy', year.toString())
          .replace('MM', pad(month))
          .replace('M', month.toString())
          .replace('dd', pad(day))
          .replace('d', day.toString())
          .replace('HH', pad(hours))
          .replace('H', hours.toString())
          .replace('mm', pad(minutes))
          .replace('m', minutes.toString())
          .replace('ss', pad(seconds))
          .replace('s', seconds.toString());
      }
      return formatDate(date, 'datetime');
    default:
      return formatDate(date, 'date');
  }
};

// ============================================================================
// 날짜 포맷팅 함수들
// ============================================================================

export const formatEventDate = (date: string | Date, formatStr: string = 'yyyy-MM-dd'): string => {
  const dateObj = parseDate(date);
  return formatDate(dateObj, 'custom', formatStr);
};

export const formatEventTime = (date: string | Date, use24Hour: boolean = true): string => {
  const dateObj = parseDate(date);
  if (use24Hour) {
    return formatDate(dateObj, 'time');
  } else {
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  }
};

export const formatEventDateTime = (date: string | Date, use24Hour: boolean = true): string => {
  const dateObj = parseDate(date);
  const dateStr = formatDate(dateObj, 'date');
  const timeStr = formatEventTime(dateObj, use24Hour);
  return `${dateStr} ${timeStr}`;
};

export const formatDateRange = (start: string | Date, end: string | Date): string => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  const startFormatted = formatDate(startDate, 'custom', 'M월 d일 HH:mm');
  const endFormatted = formatDate(endDate, 'custom', 'HH:mm');

  // 같은 날인지 확인
  if (formatDate(startDate, 'date') === formatDate(endDate, 'date')) {
    return `${startFormatted} - ${endFormatted}`;
  } else {
    const endDateFormatted = formatDate(endDate, 'custom', 'M월 d일 HH:mm');
    return `${startFormatted} - ${endDateFormatted}`;
  }
};

// ============================================================================
// 이벤트 처리 함수들
// ============================================================================

export const isEventToday = (event: CalendarEvent): boolean => {
  const today = new Date();
  const eventStart = parseDate(event.start_date);
  return formatDate(eventStart, 'date') === formatDate(today, 'date');
};

export const isEventUpcoming = (event: CalendarEvent, daysAhead: number = 7): boolean => {
  const now = new Date();
  const eventStart = parseDate(event.start_date);
  const endRange = addDays(now, daysAhead);

  return eventStart >= now && eventStart <= endRange;
};

export const isEventOverdue = (event: CalendarEvent): boolean => {
  const now = new Date();
  const eventEnd = parseDate(event.end_date);
  return eventEnd < now;
};

export const getEventDuration = (event: CalendarEvent): number => {
  const start = parseDate(event.start_date);
  const end = parseDate(event.end_date);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
};

export const isEventAllDay = (event: CalendarEvent): boolean => {
  return event.all_day;
};

export const isEventMultiDay = (event: CalendarEvent): boolean => {
  const start = parseDate(event.start_date);
  const end = parseDate(event.end_date);
  return formatDate(start, 'date') !== formatDate(end, 'date');
};

// ============================================================================
// 이벤트 충돌 및 겹침 처리
// ============================================================================

export const doEventsOverlap = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
  const start1 = parseDate(event1.start_date);
  const end1 = parseDate(event1.end_date);
  const start2 = parseDate(event2.start_date);
  const end2 = parseDate(event2.end_date);

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
    const eventStart = parseDate(event.start_date);
    const eventEnd = parseDate(event.end_date);

    // 날짜 범위 내에 있는지 확인
    return (eventStart >= dateRange.start && eventStart <= dateRange.end) ||
           (eventEnd >= dateRange.start && eventEnd <= dateRange.end) ||
           (eventStart <= dateRange.start && eventEnd >= dateRange.end);
  });
};

export const sortEventsByDateTime = (events: CalendarEvent[]): CalendarEvent[] => {
  return [...events].sort((a, b) => {
    const startA = parseDate(a.start_date);
    const startB = parseDate(b.start_date);

    if (startA.getTime() === startB.getTime()) {
      // 시작 시간이 같으면 종료 시간으로 정렬
      const endA = parseDate(a.end_date);
      const endB = parseDate(b.end_date);
      return endA.getTime() - endB.getTime();
    }

    return startA.getTime() - startB.getTime();
  });
};

export const groupEventsByDate = (events: CalendarEvent[]): Record<string, CalendarEvent[]> => {
  const grouped: Record<string, CalendarEvent[]> = {};

  events.forEach(event => {
    const dateKey = formatDate(parseDate(event.start_date), 'date');

    if (dateKey) {
      // 존재하지 않으면 빈 배열로 초기화하고 이벤트 추가
      (grouped[dateKey] ??= []).push(event);
    }
  });

  // 각 날짜의 이벤트들을 시간순으로 정렬
  Object.entries(grouped).forEach(([date, eventsForDate]) => {
    grouped[date] = sortEventsByDateTime(eventsForDate);
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
    const untilDate = parseDate(until);
    text += ` (${formatDate(untilDate, 'custom', 'yyyy년 M월 d일')}까지)`;
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

  return colors[type as keyof typeof colors] || colors.personal;
};

export const getEventPriorityColor = (priority: CalendarEvent['priority']): string => {
  const colors = {
    low: '#10B981',      // green
    medium: '#F59E0B',   // yellow
    high: '#EF4444',     // red
    urgent: '#DC2626',   // dark red
  };

  return colors[priority as keyof typeof colors] || colors.medium;
};

export const getEventStatusIcon = (status: CalendarEvent['status']): string => {
  const icons: Record<CalendarEvent['status'], string> = {
    tentative: '❓',
    confirmed: '✅',
    cancelled: '❌',
  };

  return icons[status] !== undefined ? icons[status] : '❓';
};

// ============================================================================
// 시간대 처리
// ============================================================================

export const convertToTimezone = (date: string | Date, timezone: string): Date => {
  const dateObj = parseDate(date);
  // 간단한 시간대 변환 (실제 프로덕션에서는 더 정교한 로직 필요)
  return new Date(dateObj.toLocaleString("en-US", { timeZone: timezone }));
};

export const formatTimeInTimezone = (
  date: string | Date,
  timezone: string,
  formatStr: string = 'yyyy-MM-dd HH:mm'
): string => {
  const convertedDate = convertToTimezone(date, timezone);
  return formatDate(convertedDate, 'custom', formatStr);
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
    const startDate = parseDate(event.start_date);
    const endDate = parseDate(event.end_date);

    // ICS 포맷으로 변환 (YYYYMMDDTHHMMSSZ)
    const formatForICS = (date: Date): string => {
      return formatDate(date, 'custom', 'yyyyMMddTHHmmssZ');
    };

    icsContent = icsContent.concat([
      'BEGIN:VEVENT',
      `UID:${event.id}@pms.local`,
      `DTSTART:${formatForICS(startDate)}`,
      `DTEND:${formatForICS(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      `STATUS:${event.status.toUpperCase()}`,
      `PRIORITY:${getPriorityNumber(event.priority)}`,
      `CREATED:${formatForICS(parseDate(event.created_at))}`,
      `LAST-MODIFIED:${formatForICS(parseDate(event.updated_at))}`,
      'END:VEVENT'
    ]);
  });

  icsContent.push('END:VCALENDAR');

  return icsContent.join('\r\n');
};

const getPriorityNumber = (priority: CalendarEvent['priority']): number => {
  const priorities: Record<CalendarEvent['priority'], number> = {
    low: 9,
    medium: 5,
    high: 3,
    urgent: 1
  };

  return priorities[priority] ?? 5;
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
      const eventStart = parseDate(event.start_date);
      return eventStart >= now && eventStart <= endDate;
    })
    .sort((a, b) => parseDate(a.start_date).getTime() - parseDate(b.start_date).getTime());
};

export const getOverdueEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const now = new Date();

  return events
    .filter(event => {
      const eventEnd = parseDate(event.end_date);
      return eventEnd < now && event.status !== 'cancelled';
    })
    .sort((a, b) => parseDate(b.end_date).getTime() - parseDate(a.end_date).getTime());
};
