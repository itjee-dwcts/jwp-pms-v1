"""
일정 관련 상수 정의

이벤트, 일정, 반복 설정 등 캘린더 관련 상수들을 정의합니다.
"""


class EventType:
    """이벤트 타입 상수"""

    MEETING = "meeting"  # 회의 이벤트
    DEADLINE = "deadline"  # 마감일 이벤트
    MILESTONE = "milestone"  # 프로젝트 마일스톤
    REMINDER = "reminder"  # 알림 이벤트
    PERSONAL = "personal"  # 개인 이벤트
    HOLIDAY = "holiday"  # 휴일 이벤트
    TRAINING = "training"  # 교육 또는 학습 이벤트

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.MEETING, "회의"),
            (cls.DEADLINE, "마감일"),
            (cls.MILESTONE, "마일스톤"),
            (cls.REMINDER, "알림"),
            (cls.PERSONAL, "개인일정"),
            (cls.HOLIDAY, "휴일"),
            (cls.TRAINING, "교육"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.MEETING,
            cls.DEADLINE,
            cls.MILESTONE,
            cls.REMINDER,
            cls.PERSONAL,
            cls.HOLIDAY,
            cls.TRAINING,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_work_related(cls, event_type: str) -> bool:
        """업무 관련 이벤트인지 확인"""
        return event_type in [
            cls.MEETING,
            cls.DEADLINE,
            cls.MILESTONE,
            cls.TRAINING,
        ]

    @classmethod
    def is_personal(cls, event_type: str) -> bool:
        """개인 이벤트인지 확인"""
        return event_type in [cls.PERSONAL, cls.HOLIDAY]

    @classmethod
    def requires_notification(cls, event_type: str) -> bool:
        """알림이 필요한 이벤트인지 확인"""
        return event_type in [cls.MEETING, cls.DEADLINE, cls.REMINDER]

    @classmethod
    def get_default_duration(cls, event_type: str) -> int:
        """이벤트 타입별 기본 기간 반환 (분)"""
        durations = {
            cls.MEETING: 60,  # 1시간
            cls.DEADLINE: 0,  # 기간 없음 (시점)
            cls.MILESTONE: 0,  # 기간 없음 (시점)
            cls.REMINDER: 15,  # 15분
            cls.PERSONAL: 120,  # 2시간
            cls.HOLIDAY: 1440,  # 24시간 (하루 종일)
            cls.TRAINING: 240,  # 4시간
        }
        return durations.get(event_type, 60)

    @classmethod
    def get_type_icon(cls, event_type: str) -> str:
        """이벤트 타입별 아이콘 반환"""
        icons = {
            cls.MEETING: "👥",
            cls.DEADLINE: "⏰",
            cls.MILESTONE: "🎯",
            cls.REMINDER: "🔔",
            cls.PERSONAL: "👤",
            cls.HOLIDAY: "🎉",
            cls.TRAINING: "📚",
        }
        return icons.get(event_type, "📅")


class EventStatus:
    """이벤트 상태 상수"""

    SCHEDULED = "scheduled"  # 예정된 이벤트
    IN_PROGRESS = "in_progress"  # 진행 중인 이벤트
    COMPLETED = "completed"  # 완료된 이벤트
    CANCELLED = "cancelled"  # 취소된 이벤트
    POSTPONED = "postponed"  # 연기된 이벤트

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.SCHEDULED, "예정됨"),
            (cls.IN_PROGRESS, "진행 중"),
            (cls.COMPLETED, "완료"),
            (cls.CANCELLED, "취소됨"),
            (cls.POSTPONED, "연기됨"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.SCHEDULED,
            cls.IN_PROGRESS,
            cls.COMPLETED,
            cls.CANCELLED,
            cls.POSTPONED,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_active(cls, status: str) -> bool:
        """활성 상태인지 확인"""
        return status in [cls.SCHEDULED, cls.IN_PROGRESS]

    @classmethod
    def is_finished(cls, status: str) -> bool:
        """완료 상태인지 확인"""
        return status in [cls.COMPLETED, cls.CANCELLED]

    @classmethod
    def can_modify(cls, status: str) -> bool:
        """수정 가능한 상태인지 확인"""
        return status in [cls.SCHEDULED, cls.POSTPONED]

    @classmethod
    def get_status_color(cls, status: str) -> str:
        """상태별 색상 반환"""
        colors = {
            cls.SCHEDULED: "blue",
            cls.IN_PROGRESS: "green",
            cls.COMPLETED: "gray",
            cls.CANCELLED: "red",
            cls.POSTPONED: "orange",
        }
        return colors.get(status, "gray")


class RecurrenceType:
    """이벤트 반복 타입 상수"""

    NONE = "none"  # 반복 없음 (일회성 이벤트)
    DAILY = "daily"  # 매일 반복
    WEEKLY = "weekly"  # 매주 반복
    MONTHLY = "monthly"  # 매월 반복
    YEARLY = "yearly"  # 매년 반복
    WEEKDAYS = "weekdays"  # 평일만 (월-금)
    CUSTOM = "custom"  # 사용자 정의 반복 패턴

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.NONE, "반복 없음"),
            (cls.DAILY, "매일"),
            (cls.WEEKLY, "매주"),
            (cls.MONTHLY, "매월"),
            (cls.YEARLY, "매년"),
            (cls.WEEKDAYS, "평일 (월-금)"),
            (cls.CUSTOM, "사용자 정의"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.NONE,
            cls.DAILY,
            cls.WEEKLY,
            cls.MONTHLY,
            cls.YEARLY,
            cls.WEEKDAYS,
            cls.CUSTOM,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_recurring(cls, value: str) -> bool:
        """반복 이벤트를 생성하는지 확인"""
        return value != cls.NONE

    @classmethod
    def get_frequency_description(cls, recurrence_type: str, interval: int = 1) -> str:
        """사람이 읽기 쉬운 빈도 설명 반환"""
        descriptions = {
            cls.NONE: "일회성 이벤트",
            cls.DAILY: f"매 {interval}일마다" if interval > 1 else "매일",
            cls.WEEKLY: f"매 {interval}주마다" if interval > 1 else "매주",
            cls.MONTHLY: f"매 {interval}개월마다" if interval > 1 else "매월",
            cls.YEARLY: f"매 {interval}년마다" if interval > 1 else "매년",
            cls.WEEKDAYS: "매 평일 (월-금)",
            cls.CUSTOM: "사용자 정의 반복 패턴",
        }
        return descriptions.get(recurrence_type, "알 수 없음")

    @classmethod
    def get_next_occurrence_days(cls, recurrence_type: str, interval: int = 1) -> int:
        """다음 발생까지의 일수 반환"""
        days_map = {
            cls.DAILY: interval,
            cls.WEEKLY: interval * 7,
            cls.MONTHLY: interval * 30,  # 근사치
            cls.YEARLY: interval * 365,  # 근사치
            cls.WEEKDAYS: 1,  # 다음 평일
        }
        return days_map.get(recurrence_type, 0)


class EventAttendeeStatus:
    """이벤트 참석자 상태 상수"""

    INVITED = "invited"  # 초대됨 (응답 안함)
    ACCEPTED = "accepted"  # 초대 수락
    DECLINED = "declined"  # 초대 거절
    TENTATIVE = "tentative"  # 잠정적 수락
    NO_RESPONSE = "no_response"  # 응답 없음

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.INVITED, "초대됨"),
            (cls.ACCEPTED, "수락"),
            (cls.DECLINED, "거절"),
            (cls.TENTATIVE, "미정"),
            (cls.NO_RESPONSE, "응답 없음"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.INVITED,
            cls.ACCEPTED,
            cls.DECLINED,
            cls.TENTATIVE,
            cls.NO_RESPONSE,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_confirmed(cls, status: str) -> bool:
        """참석자 상태가 확정되었는지 확인 (수락 또는 거절)"""
        return status in [cls.ACCEPTED, cls.DECLINED]

    @classmethod
    def is_attending(cls, status: str) -> bool:
        """참석 예정인지 확인"""
        return status in [cls.ACCEPTED, cls.TENTATIVE]

    @classmethod
    def needs_response(cls, status: str) -> bool:
        """응답이 필요한 상태인지 확인"""
        return status in [cls.INVITED, cls.NO_RESPONSE]

    @classmethod
    def get_status_icon(cls, status: str) -> str:
        """참석자 상태별 아이콘 반환"""
        icons = {
            cls.INVITED: "📬",
            cls.ACCEPTED: "✅",
            cls.DECLINED: "❌",
            cls.TENTATIVE: "❓",
            cls.NO_RESPONSE: "⏳",
        }
        return icons.get(status, "❓")


class EventReminder:
    """이벤트 알림 시간 상수"""

    NONE = "none"  # 알림 없음
    AT_TIME = "at_time"  # 이벤트 시간에
    FIVE_MINUTES = "5_minutes"  # 5분 전
    TEN_MINUTES = "10_minutes"  # 10분 전
    FIFTEEN_MINUTES = "15_minutes"  # 15분 전
    THIRTY_MINUTES = "30_minutes"  # 30분 전
    ONE_HOUR = "1_hour"  # 1시간 전
    TWO_HOURS = "2_hours"  # 2시간 전
    ONE_DAY = "1_day"  # 1일 전
    ONE_WEEK = "1_week"  # 1주일 전

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.NONE, "알림 없음"),
            (cls.AT_TIME, "이벤트 시간에"),
            (cls.FIVE_MINUTES, "5분 전"),
            (cls.TEN_MINUTES, "10분 전"),
            (cls.FIFTEEN_MINUTES, "15분 전"),
            (cls.THIRTY_MINUTES, "30분 전"),
            (cls.ONE_HOUR, "1시간 전"),
            (cls.TWO_HOURS, "2시간 전"),
            (cls.ONE_DAY, "1일 전"),
            (cls.ONE_WEEK, "1주일 전"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.NONE,
            cls.AT_TIME,
            cls.FIVE_MINUTES,
            cls.TEN_MINUTES,
            cls.FIFTEEN_MINUTES,
            cls.THIRTY_MINUTES,
            cls.ONE_HOUR,
            cls.TWO_HOURS,
            cls.ONE_DAY,
            cls.ONE_WEEK,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_minutes_before(cls, reminder_type: str) -> int:
        """알림 계산을 위한 이벤트 전 분 수 반환"""
        minutes_map = {
            cls.NONE: 0,
            cls.AT_TIME: 0,
            cls.FIVE_MINUTES: 5,
            cls.TEN_MINUTES: 10,
            cls.FIFTEEN_MINUTES: 15,
            cls.THIRTY_MINUTES: 30,
            cls.ONE_HOUR: 60,
            cls.TWO_HOURS: 120,
            cls.ONE_DAY: 1440,  # 24 * 60
            cls.ONE_WEEK: 10080,  # 7 * 24 * 60
        }
        return minutes_map.get(reminder_type, 0)

    @classmethod
    def get_default_reminders(cls, event_type: str) -> list[str]:
        """이벤트 타입별 기본 알림 설정 반환"""
        defaults = {
            EventType.MEETING: [cls.FIFTEEN_MINUTES, cls.ONE_DAY],
            EventType.DEADLINE: [cls.ONE_HOUR, cls.ONE_DAY, cls.ONE_WEEK],
            EventType.MILESTONE: [cls.ONE_DAY],
            EventType.REMINDER: [cls.AT_TIME],
            EventType.PERSONAL: [cls.THIRTY_MINUTES],
            EventType.HOLIDAY: [cls.ONE_DAY],
            EventType.TRAINING: [cls.ONE_HOUR, cls.ONE_DAY],
        }
        return defaults.get(event_type, [cls.FIFTEEN_MINUTES])


class CalendarView:
    """캘린더 뷰 상수"""

    MONTH = "month"  # 월간 보기
    WEEK = "week"  # 주간 보기
    DAY = "day"  # 일간 보기
    AGENDA = "agenda"  # 일정 목록 보기
    YEAR = "year"  # 연간 보기

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.MONTH, "월간"),
            (cls.WEEK, "주간"),
            (cls.DAY, "일간"),
            (cls.AGENDA, "일정표"),
            (cls.YEAR, "연간"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.MONTH, cls.WEEK, cls.DAY, cls.AGENDA, cls.YEAR]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_view_icon(cls, view: str) -> str:
        """뷰 타입별 아이콘 반환"""
        icons = {
            cls.MONTH: "📅",
            cls.WEEK: "📆",
            cls.DAY: "📋",
            cls.AGENDA: "📃",
            cls.YEAR: "🗓️",
        }
        return icons.get(view, "📅")

    @classmethod
    def get_events_per_page(cls, view: str) -> int:
        """뷰별 페이지당 이벤트 수 반환"""
        events_per_page = {
            cls.MONTH: 100,
            cls.WEEK: 50,
            cls.DAY: 20,
            cls.AGENDA: 25,
            cls.YEAR: 500,
        }
        return events_per_page.get(view, 50)


# ============================================================================
# 캘린더 관련 기본값 및 제한
# ============================================================================

# 기본값
DEFAULT_EVENT_STATUS = EventStatus.SCHEDULED
DEFAULT_EVENT_TYPE = EventType.MEETING
DEFAULT_RECURRENCE_TYPE = RecurrenceType.NONE
DEFAULT_ATTENDEE_STATUS = EventAttendeeStatus.INVITED
DEFAULT_REMINDER = EventReminder.FIFTEEN_MINUTES
DEFAULT_CALENDAR_VIEW = CalendarView.MONTH

# 이벤트 제한
EVENT_LIMITS = {
    "max_title_length": 200,
    "max_description_length": 2000,
    "max_attendees": 100,
    "max_reminders": 5,
    "max_duration_hours": 24,
    "max_recurring_instances": 365,
}

# 이벤트 색상 매핑
EVENT_TYPE_COLORS = {
    EventType.MEETING: "#3B82F6",  # 파란색
    EventType.DEADLINE: "#EF4444",  # 빨간색
    EventType.MILESTONE: "#10B981",  # 녹색
    EventType.REMINDER: "#F59E0B",  # 주황색
    EventType.PERSONAL: "#8B5CF6",  # 보라색
    EventType.HOLIDAY: "#EC4899",  # 분홍색
    EventType.TRAINING: "#06B6D4",  # 시안색
}

EVENT_STATUS_COLORS = {
    EventStatus.SCHEDULED: "#3B82F6",  # 파란색
    EventStatus.IN_PROGRESS: "#10B981",  # 녹색
    EventStatus.COMPLETED: "#6B7280",  # 회색
    EventStatus.CANCELLED: "#EF4444",  # 빨간색
    EventStatus.POSTPONED: "#F59E0B",  # 주황색
}

# 시간대 설정
TIMEZONE_SETTINGS = {
    "default_timezone": "Asia/Seoul",
    "display_timezone": True,
    "auto_detect_timezone": True,
    "allow_timezone_override": True,
}

# 캘린더 설정
CALENDAR_SETTINGS = {
    "week_start_day": 1,  # 0=일요일, 1=월요일
    "working_hours_start": "09:00",
    "working_hours_end": "18:00",
    "working_days": [1, 2, 3, 4, 5],  # 월-금
    "show_weekends": True,
    "show_week_numbers": False,
    "default_event_duration": 60,  # 분
}

# 알림 설정
NOTIFICATION_SETTINGS = {
    "email_reminders": True,
    "push_notifications": True,
    "sms_reminders": False,
    "desktop_notifications": True,
    "digest_frequency": "daily",
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00",
}

# 반복 이벤트 설정
RECURRENCE_SETTINGS = {
    "max_occurrences": 365,
    "max_end_date_years": 5,
    "auto_cleanup_old_events": True,
    "cleanup_after_months": 12,
}

# 이벤트 템플릿
EVENT_TEMPLATES = {
    EventType.MEETING: {
        "default_duration": 60,
        "require_attendees": True,
        "default_reminders": [EventReminder.FIFTEEN_MINUTES],
        "fields": ["agenda", "location", "video_link"],
    },
    EventType.DEADLINE: {
        "default_duration": 0,
        "require_attendees": False,
        "default_reminders": [EventReminder.ONE_DAY, EventReminder.ONE_WEEK],
        "fields": ["priority", "project"],
    },
    EventType.TRAINING: {
        "default_duration": 240,
        "require_attendees": True,
        "default_reminders": [EventReminder.ONE_HOUR, EventReminder.ONE_DAY],
        "fields": ["instructor", "materials", "location"],
    },
}

# 캘린더 권한
CALENDAR_PERMISSIONS = {
    "view_calendar": ["owner", "editor", "viewer"],
    "create_events": ["owner", "editor"],
    "edit_events": ["owner", "editor", "creator"],
    "delete_events": ["owner", "editor", "creator"],
    "invite_attendees": ["owner", "editor"],
    "manage_calendar": ["owner"],
}

# 이메일 템플릿
CALENDAR_EMAIL_TEMPLATES = {
    "event_invitation": "event_invitation.html",
    "event_update": "event_update.html",
    "event_cancellation": "event_cancellation.html",
    "event_reminder": "event_reminder.html",
    "daily_digest": "daily_digest.html",
}

# 통합 설정 (외부 캘린더 연동)
INTEGRATION_SETTINGS = {
    "google_calendar": {
        "enabled": False,
        "sync_frequency": "15_minutes",
        "two_way_sync": True,
    },
    "outlook": {
        "enabled": False,
        "sync_frequency": "15_minutes",
        "two_way_sync": True,
    },
    "icalendar_export": {
        "enabled": True,
        "include_private_events": False,
    },
}
