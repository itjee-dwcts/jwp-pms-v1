// ============================================================================
// constants/calendar.ts - 캘린더 및 이벤트 관련 상수 정의
// ============================================================================

// ============================================================================
// 이벤트 타입
// ============================================================================
export const EVENT_TYPE = {
  MEETING: 'meeting',
  TASK: 'task',
  REMINDER: 'reminder',
  DEADLINE: 'deadline',
  HOLIDAY: 'holiday',
  PERSONAL: 'personal',
} as const;

export type EventType = typeof EVENT_TYPE[keyof typeof EVENT_TYPE];

// ============================================================================
// 이벤트 상태
// ============================================================================
export const EVENT_STATUS = {
  TENTATIVE: 'tentative',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;

export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];

// ============================================================================
// 이벤트 우선순위
// ============================================================================
export const EVENT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type EventPriority = typeof EVENT_PRIORITY[keyof typeof EVENT_PRIORITY];

// ============================================================================
// 캘린더 뷰
// ============================================================================
export const CALENDAR_VIEW = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda',
  YEAR: 'year',
} as const;

export type CalendarView = typeof CALENDAR_VIEW[keyof typeof CALENDAR_VIEW];

// ============================================================================
// 참석자 상태
// ============================================================================
export const ATTENDEE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  TENTATIVE: 'tentative',
} as const;

export type AttendeeStatus = typeof ATTENDEE_STATUS[keyof typeof ATTENDEE_STATUS];

// ============================================================================
// 라벨 매핑
// ============================================================================

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EVENT_TYPE.MEETING]: '회의',
  [EVENT_TYPE.TASK]: '작업',
  [EVENT_TYPE.REMINDER]: '알림',
  [EVENT_TYPE.DEADLINE]: '마감일',
  [EVENT_TYPE.HOLIDAY]: '휴일',
  [EVENT_TYPE.PERSONAL]: '개인',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EVENT_STATUS.TENTATIVE]: '미정',
  [EVENT_STATUS.CONFIRMED]: '확정',
  [EVENT_STATUS.CANCELLED]: '취소',
};

export const EVENT_PRIORITY_LABELS: Record<EventPriority, string> = {
  [EVENT_PRIORITY.LOW]: '낮음',
  [EVENT_PRIORITY.MEDIUM]: '보통',
  [EVENT_PRIORITY.HIGH]: '높음',
  [EVENT_PRIORITY.URGENT]: '긴급',
};

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
  [CALENDAR_VIEW.MONTH]: '월간',
  [CALENDAR_VIEW.WEEK]: '주간',
  [CALENDAR_VIEW.DAY]: '일간',
  [CALENDAR_VIEW.AGENDA]: '일정표',
  [CALENDAR_VIEW.YEAR]: '연간',
};

export const ATTENDEE_STATUS_LABELS: Record<AttendeeStatus, string> = {
  [ATTENDEE_STATUS.PENDING]: '대기 중',
  [ATTENDEE_STATUS.ACCEPTED]: '참석',
  [ATTENDEE_STATUS.DECLINED]: '불참',
  [ATTENDEE_STATUS.TENTATIVE]: '미정',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  [EVENT_TYPE.MEETING]: 'blue',
  [EVENT_TYPE.TASK]: 'green',
  [EVENT_TYPE.REMINDER]: 'yellow',
  [EVENT_TYPE.DEADLINE]: 'red',
  [EVENT_TYPE.HOLIDAY]: 'purple',
  [EVENT_TYPE.PERSONAL]: 'pink',
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  [EVENT_STATUS.TENTATIVE]: 'yellow',
  [EVENT_STATUS.CONFIRMED]: 'green',
  [EVENT_STATUS.CANCELLED]: 'red',
};

export const EVENT_PRIORITY_COLORS: Record<EventPriority, string> = {
  [EVENT_PRIORITY.LOW]: 'gray',
  [EVENT_PRIORITY.MEDIUM]: 'blue',
  [EVENT_PRIORITY.HIGH]: 'orange',
  [EVENT_PRIORITY.URGENT]: 'red',
};

export const ATTENDEE_STATUS_COLORS: Record<AttendeeStatus, string> = {
  [ATTENDEE_STATUS.PENDING]: 'yellow',
  [ATTENDEE_STATUS.ACCEPTED]: 'green',
  [ATTENDEE_STATUS.DECLINED]: 'red',
  [ATTENDEE_STATUS.TENTATIVE]: 'orange',
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as EventType, label })
);

export const EVENT_STATUS_OPTIONS = Object.entries(EVENT_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as EventStatus, label })
);

export const EVENT_PRIORITY_OPTIONS = Object.entries(EVENT_PRIORITY_LABELS).map(
  ([value, label]) => ({ value: value as EventPriority, label })
);

export const CALENDAR_VIEW_OPTIONS = Object.entries(CALENDAR_VIEW_LABELS).map(
  ([value, label]) => ({ value: value as CalendarView, label })
);

export const ATTENDEE_STATUS_OPTIONS = Object.entries(ATTENDEE_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as AttendeeStatus, label })
);

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidEventType = (type: string): type is EventType => {
  return Object.values(EVENT_TYPE).includes(type as EventType);
};

export const isValidEventStatus = (status: string): status is EventStatus => {
  return Object.values(EVENT_STATUS).includes(status as EventStatus);
};

export const isValidEventPriority = (priority: string): priority is EventPriority => {
  return Object.values(EVENT_PRIORITY).includes(priority as EventPriority);
};

export const isValidCalendarView = (view: string): view is CalendarView => {
  return Object.values(CALENDAR_VIEW).includes(view as CalendarView);
};

export const isValidAttendeeStatus = (status: string): status is AttendeeStatus => {
  return Object.values(ATTENDEE_STATUS).includes(status as AttendeeStatus);
};

export const isEventConfirmed = (status: EventStatus): boolean => {
  return status === EVENT_STATUS.CONFIRMED;
};

export const isEventCancelled = (status: EventStatus): boolean => {
  return status === EVENT_STATUS.CANCELLED;
};

export const isEventTentative = (status: EventStatus): boolean => {
  return status === EVENT_STATUS.TENTATIVE;
};

export const isAttendeeConfirmed = (status: AttendeeStatus): boolean => {
  return status === ATTENDEE_STATUS.ACCEPTED;
};

export const isAttendeeDeclined = (status: AttendeeStatus): boolean => {
  return status === ATTENDEE_STATUS.DECLINED;
};

export const isAttendeePending = (status: AttendeeStatus): boolean => {
  return ([ATTENDEE_STATUS.PENDING, ATTENDEE_STATUS.TENTATIVE] as AttendeeStatus[]).includes(status);
};

export const getEventTypeIcon = (type: EventType): string => {
  const iconMap = {
    [EVENT_TYPE.MEETING]: '👥',
    [EVENT_TYPE.TASK]: '📋',
    [EVENT_TYPE.REMINDER]: '⏰',
    [EVENT_TYPE.DEADLINE]: '🚨',
    [EVENT_TYPE.HOLIDAY]: '🎉',
    [EVENT_TYPE.PERSONAL]: '👤',
  };

  return iconMap[type];
};

export const getEventStatusIcon = (status: EventStatus): string => {
  const iconMap = {
    [EVENT_STATUS.TENTATIVE]: '❓',
    [EVENT_STATUS.CONFIRMED]: '✅',
    [EVENT_STATUS.CANCELLED]: '❌',
  };

  return iconMap[status];
};

export const getEventPriorityIcon = (priority: EventPriority): string => {
  const iconMap = {
    [EVENT_PRIORITY.LOW]: '⬇️',
    [EVENT_PRIORITY.MEDIUM]: '➡️',
    [EVENT_PRIORITY.HIGH]: '⬆️',
    [EVENT_PRIORITY.URGENT]: '🚨',
  };

  return iconMap[priority];
};

export const getCalendarViewIcon = (view: CalendarView): string => {
  const iconMap = {
    [CALENDAR_VIEW.MONTH]: '📅',
    [CALENDAR_VIEW.WEEK]: '📆',
    [CALENDAR_VIEW.DAY]: '📋',
    [CALENDAR_VIEW.AGENDA]: '📃',
    [CALENDAR_VIEW.YEAR]: '🗓️',
  };

  return iconMap[view];
};

export const getAttendeeStatusIcon = (status: AttendeeStatus): string => {
  const iconMap = {
    [ATTENDEE_STATUS.PENDING]: '⏳',
    [ATTENDEE_STATUS.ACCEPTED]: '✅',
    [ATTENDEE_STATUS.DECLINED]: '❌',
    [ATTENDEE_STATUS.TENTATIVE]: '❓',
  };

  return iconMap[status];
};

export const getEventPriorityWeight = (priority: EventPriority): number => {
  const weightMap = {
    [EVENT_PRIORITY.LOW]: 1,
    [EVENT_PRIORITY.MEDIUM]: 2,
    [EVENT_PRIORITY.HIGH]: 3,
    [EVENT_PRIORITY.URGENT]: 4,
  };

  return weightMap[priority];
};

// 캘린더 뷰 순서 가져오기
export const getCalendarViewOrder = (view: CalendarView): number => {
  const orderMap = {
    [CALENDAR_VIEW.DAY]: 1,
    [CALENDAR_VIEW.WEEK]: 2,
    [CALENDAR_VIEW.MONTH]: 3,
    [CALENDAR_VIEW.YEAR]: 4,
    [CALENDAR_VIEW.AGENDA]: 5,
  };

  return orderMap[view];
};

// 이벤트 타입별 기본 기간 (분)
export const getDefaultEventDuration = (type: EventType): number => {
  const durationMap = {
    [EVENT_TYPE.MEETING]: 60,      // 1시간
    [EVENT_TYPE.TASK]: 120,        // 2시간
    [EVENT_TYPE.REMINDER]: 15,     // 15분
    [EVENT_TYPE.DEADLINE]: 0,      // 기간 없음
    [EVENT_TYPE.HOLIDAY]: 1440,    // 24시간 (하루 종일)
    [EVENT_TYPE.PERSONAL]: 60,     // 1시간
  };

  return durationMap[type];
};
