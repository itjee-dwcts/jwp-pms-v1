// ============================================================================
// Calendar Types
// ============================================================================

export type EventType = 'meeting' | 'task' | 'reminder' | 'deadline' | 'holiday' | 'personal';
export type EventStatus = 'tentative' | 'confirmed' | 'cancelled';
export type EventPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'year';
export type AttendeeStatus = 'pending' | 'accepted' | 'declined' | 'tentative';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  type: EventType;
  status: EventStatus;
  priority: EventPriority;
  color?: string;
  location?: string;
  url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;

  // 관계 데이터
  project_id?: string;
  task_id?: string;
  attendees?: EventAttendee[];
  attachments?: EventAttachment[];
  reminders?: EventReminder[];

  // 반복 설정
  recurrence_rule?: string;
  recurrence_end?: string;
  is_recurring: boolean;
  parent_event_id?: string;

  //
  reminder_type?: string;
  reminder_minutes?: number[];

  // 메타데이터
  timezone?: string;
  visibility: 'public' | 'private' | 'confidential';
  metadata?: Record<string, any>;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: AttendeeStatus;
  is_organizer: boolean;
  added_at: string;
  responded_at?: string;

  // 사용자 정보
  user: {
    id: string;
    username: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface EventAttachment {
  id: string;
  event_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface EventReminder {
  id: string;
  event_id: string;
  type: 'email' | 'notification' | 'sms';
  minutes_before: number;
  sent_at?: string;
  created_at: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day?: boolean;
  type: EventType;
  priority?: EventPriority;
  color?: string;
  location?: string;
  url?: string;
  project_id?: string;
  task_id?: string;
  attendee_ids?: string[];
  reminder_minutes?: number[];
  timezone?: string;
  visibility?: 'public' | 'private' | 'confidential';
  metadata?: Record<string, any>;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  all_day?: boolean;
  type?: EventType;
  status?: EventStatus;
  priority?: EventPriority;
  color?: string;
  location?: string;
  url?: string;
  project_id?: string;
  task_id?: string;
  timezone?: string;
  visibility?: 'public' | 'private' | 'confidential';
  metadata?: Record<string, any>;
}

export interface EventFilters {
  start_date?: string;
  end_date?: string;
  type?: EventType[];
  status?: EventStatus[];
  priority?: EventPriority[];
  project_id?: string;
  task_id?: string;
  attendee_id?: string;
  created_by?: string;
  search?: string;
  visibility?: 'public' | 'private' | 'confidential';
  include_recurring?: boolean;
}

// ============================================================================
// Calendar View Types
// ============================================================================

export interface CalendarViewConfig {
  view: CalendarView;
  date: Date;
  showWeekends: boolean;
  showAllDay: boolean;
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  workingHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  slotDuration: number; // minutes
  showTimeGrid: boolean;
}

export interface CalendarEventDisplay extends CalendarEvent {
  display_start: Date;
  display_end: Date;
  is_multiday: boolean;
  duration_minutes: number;
  conflicts?: CalendarEvent[];
}

// ============================================================================
// Recurring Event Types
// ============================================================================

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  count?: number;
  until?: string;
  by_day?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  by_month_day?: number[];
  by_month?: number[];
  by_year_day?: number[];
}

export interface RecurringEventInfo {
  rule: RecurrenceRule;
  exceptions: string[]; // dates to exclude
  modifications: { [date: string]: Partial<CalendarEvent> };
}

// ============================================================================
// Calendar Integration Types
// ============================================================================

export interface ExternalCalendar {
  id: string;
  name: string;
  provider: 'google' | 'outlook' | 'apple' | 'caldav';
  url?: string;
  username?: string;
  is_active: boolean;
  last_sync?: string;
  sync_frequency: number; // minutes
  default_event_type: EventType;
  color: string;
}

export interface CalendarSyncStatus {
  calendar_id: string;
  last_sync: string;
  status: 'success' | 'error' | 'in_progress';
  events_synced: number;
  errors?: string[];
}

// ============================================================================
// Calendar Settings Types
// ============================================================================

export interface CalendarSettings {
  default_view: CalendarView;
  default_event_type: EventType;
  default_event_duration: number; // minutes
  default_reminder_minutes: number[];
  timezone: string;
  week_starts_on: 0 | 1; // 0 = Sunday, 1 = Monday
  working_hours: {
    start: string;
    end: string;
    days: number[]; // [1,2,3,4,5] for Mon-Fri
  };
  show_weekends: boolean;
  show_declined_events: boolean;
  auto_add_task_deadlines: boolean;
  auto_add_project_milestones: boolean;
  notification_preferences: {
    email_reminders: boolean;
    browser_notifications: boolean;
    daily_agenda_email: boolean;
  };
}

// ============================================================================
// Calendar Analytics Types
// ============================================================================

export interface CalendarAnalytics {
  period: {
    start_date: string;
    end_date: string;
  };
  stats: {
    total_events: number;
    events_by_type: { [key in EventType]: number };
    events_by_priority: { [key in EventPriority]: number };
    average_event_duration: number;
    busiest_day: string;
    busiest_hour: number;
    attendance_rate: number;
  };
  trends: {
    events_over_time: Array<{
      date: string;
      count: number;
    }>;
    duration_over_time: Array<{
      date: string;
      total_minutes: number;
    }>;
  };
}

// ============================================================================
// Calendar Component Props Types
// ============================================================================

export interface CalendarProps {
  events: CalendarEvent[];
  view?: CalendarView;
  date?: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void;
  onEventResize?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  onDateChange?: (date: Date) => void;
  editable?: boolean;
  selectable?: boolean;
  eventDisplay?: 'auto' | 'block' | 'list-item' | 'background' | 'inverse-background';
  height?: number | 'auto';
  className?: string;
}

export interface EventModalProps {
  event?: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CreateEventRequest | UpdateEventRequest) => void;
  onDelete?: (eventId: string) => void;
  mode: 'create' | 'edit' | 'view';
}

// ============================================================================
// Calendar Utility Types
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  duration: number; // minutes
}

export interface CalendarConflict {
  event1: CalendarEvent;
  event2: CalendarEvent;
  overlap_start: string;
  overlap_end: string;
  overlap_duration: number; // minutes
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
  conflicting_events?: CalendarEvent[];
}
