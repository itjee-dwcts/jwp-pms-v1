import type {
  CalendarEvent,
  CalendarSettings,
  CalendarSyncStatus,
  CreateEventRequest,
  EventFilters,
  ExternalCalendar,
  UpdateEventRequest
} from '../types/calendar';
import { buildQueryParams } from '../utils/query-params';
import { apiClient } from './api-client';

export class CalendarService {
  private readonly baseUrl = '/api/v1/calendar';

  /**
   * 모든 이벤트 조회
   */
  async getEvents(filters?: EventFilters): Promise<CalendarEvent[]> {
    const queryString = filters ? buildQueryParams(filters) : '';
    return apiClient.request<CalendarEvent[]>(
      `${this.baseUrl}/events${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * 특정 기간의 이벤트 조회
   */
  async getEventsInRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const params = {
      start_date: startDate,
      end_date: endDate
    };
    const queryString = buildQueryParams(params);
    return apiClient.request<CalendarEvent[]>(
      `${this.baseUrl}/events/range?${queryString}`
    );
  }

  /**
   * 특정 이벤트 상세 조회
   */
  async getEvent(eventId: string): Promise<CalendarEvent> {
    return apiClient.request<CalendarEvent>(
      `${this.baseUrl}/events/${eventId}`
    );
  }

  /**
   * 이벤트 생성
   */
  async createEvent(eventData: CreateEventRequest): Promise<CalendarEvent> {
    return apiClient.request<CalendarEvent>(`${this.baseUrl}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  /**
   * 이벤트 수정
   */
  async updateEvent(eventId: string, eventData: UpdateEventRequest): Promise<CalendarEvent> {
    return apiClient.request<CalendarEvent>(`${this.baseUrl}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  /**
   * 이벤트 삭제
   */
  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 이벤트에 참여자 추가
   */
  async addAttendees(eventId: string, userIds: string[]): Promise<CalendarEvent> {
    return apiClient.request<CalendarEvent>(`${this.baseUrl}/events/${eventId}/attendees`, {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds }),
    });
  }

  /**
   * 이벤트에서 참여자 제거
   */
  async removeAttendees(eventId: string, userIds: string[]): Promise<CalendarEvent> {
    return apiClient.request<CalendarEvent>(`${this.baseUrl}/events/${eventId}/attendees`, {
      method: 'DELETE',
      body: JSON.stringify({ user_ids: userIds }),
    });
  }

  /**
   * 사용자의 캘린더 설정 조회
   */
  async getUserCalendarSettings(): Promise<CalendarSettings> {
    return apiClient.request<CalendarSettings>(`${this.baseUrl}/settings`);
  }

  /**
   * 사용자의 캘린더 설정 업데이트
   */
  async updateUserCalendarSettings(settings: Partial<CalendarSettings>): Promise<CalendarSettings> {
    return apiClient.request<CalendarSettings>(`${this.baseUrl}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  /**
   * 이벤트 검색
   */
  async searchEvents(query: string, filters?: EventFilters): Promise<CalendarEvent[]> {
    const params = {
      q: query,
      ...filters
    };
    const queryString = buildQueryParams(params);
    return apiClient.request<CalendarEvent[]>(
      `${this.baseUrl}/events/search?${queryString}`
    );
  }

  /**
   * 반복 이벤트 생성
   */
  async createRecurringEvent(eventData: CreateEventRequest & {
    recurrence_rule: string;
    recurrence_end?: string;
  }): Promise<CalendarEvent[]> {
    return apiClient.request<CalendarEvent[]>(`${this.baseUrl}/events/recurring`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  /**
   * 이벤트 내보내기 (ICS 포맷)
   */
  async exportEvents(filters?: EventFilters): Promise<Blob> {
    const queryString = filters ? buildQueryParams(filters) : '';

    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/events/export${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Events export failed');
    }

    return response.blob();
  }

  /**
   * 이벤트 가져오기 (ICS 파일)
   */
  async importEvents(file: File): Promise<CalendarEvent[]> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/events/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Events import failed');
    }

    return response.json();
  }

  /**
   * 이벤트 충돌 검사
   */
  async checkEventConflicts(
    startDate: string,
    endDate: string,
    attendeeIds?: string[],
    excludeEventId?: string
  ): Promise<CalendarEvent[]> {
    return apiClient.request<CalendarEvent[]>(`${this.baseUrl}/events/conflicts`, {
      method: 'POST',
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        attendee_ids: attendeeIds,
        exclude_event_id: excludeEventId
      }),
    });
  }

  /**
   * 이벤트 복제
   */
  async duplicateEvent(eventId: string, newStartDate?: string): Promise<CalendarEvent> {
    return apiClient.request<CalendarEvent>(`${this.baseUrl}/events/${eventId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ new_start_date: newStartDate }),
    });
  }

  /**
   * 이벤트 일괄 삭제
   */
  async bulkDeleteEvents(eventIds: string[]): Promise<void> {
    await apiClient.request(`${this.baseUrl}/events/bulk-delete`, {
      method: 'DELETE',
      body: JSON.stringify({ event_ids: eventIds }),
    });
  }

  /**
   * 이벤트 일괄 업데이트
   */
  async bulkUpdateEvents(updates: {
    event_ids: string[];
    data: Partial<UpdateEventRequest>;
  }): Promise<CalendarEvent[]> {
    return apiClient.request<CalendarEvent[]>(`${this.baseUrl}/events/bulk-update`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * 캘린더 분석 데이터 조회
   */
  async getCalendarAnalytics(startDate: string, endDate: string): Promise<any> {
    const params = {
      start_date: startDate,
      end_date: endDate
    };
    const queryString = buildQueryParams(params);
    return apiClient.request<any>(`${this.baseUrl}/analytics?${queryString}`);
  }

  /**
   * 외부 캘린더 목록 조회
   */
  async getExternalCalendars(): Promise<ExternalCalendar[]> {
    return apiClient.request<ExternalCalendar[]>(`${this.baseUrl}/external`);
  }

  /**
   * 외부 캘린더 추가
   */
  async addExternalCalendar(calendarData: Omit<ExternalCalendar, 'id' | 'last_sync'>): Promise<ExternalCalendar> {
    return apiClient.request<ExternalCalendar>(`${this.baseUrl}/external`, {
      method: 'POST',
      body: JSON.stringify(calendarData),
    });
  }

  /**
   * 외부 캘린더 동기화
   */
  async syncExternalCalendar(calendarId: string): Promise<CalendarSyncStatus> {
    return apiClient.request<CalendarSyncStatus>(`${this.baseUrl}/external/${calendarId}/sync`, {
      method: 'POST',
    });
  }

  /**
   * 외부 캘린더 제거
   */
  async removeExternalCalendar(calendarId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/external/${calendarId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 이벤트 참여 상태 업데이트
   */
  async updateAttendanceStatus(
    eventId: string,
    status: 'accepted' | 'declined' | 'tentative'
  ): Promise<CalendarEvent> {
    return apiClient.request<CalendarEvent>(`${this.baseUrl}/events/${eventId}/attendance`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * 이벤트 알림 설정
   */
  async setEventReminders(
    eventId: string,
    reminders: Array<{
      type: 'email' | 'notification' | 'sms';
      minutes_before: number;
    }>
  ): Promise<CalendarEvent> {
    return apiClient.request<CalendarEvent>(`${this.baseUrl}/events/${eventId}/reminders`, {
      method: 'PUT',
      body: JSON.stringify({ reminders }),
    });
  }

  /**
   * 가용 시간 조회
   */
  async getAvailability(
    userIds: string[],
    startDate: string,
    endDate: string,
    duration?: number
  ): Promise<any> {
    return apiClient.request<any>(`${this.baseUrl}/availability`, {
      method: 'POST',
      body: JSON.stringify({
        user_ids: userIds,
        start_date: startDate,
        end_date: endDate,
        duration
      }),
    });
  }

  /**
   * 회의실 예약 가능 여부 확인
   */
  async checkRoomAvailability(
    roomId: string,
    startDate: string,
    endDate: string
  ): Promise<{ available: boolean; conflicts?: CalendarEvent[] }> {
    const params = {
      start_date: startDate,
      end_date: endDate
    };
    const queryString = buildQueryParams(params);
    return apiClient.request<{ available: boolean; conflicts?: CalendarEvent[] }>(
      `${this.baseUrl}/rooms/${roomId}/availability?${queryString}`
    );
  }

  /**
   * 회의실 예약
   */
  async bookRoom(eventId: string, roomId: string): Promise<CalendarEvent> {
    return apiClient.request<CalendarEvent>(`${this.baseUrl}/events/${eventId}/room`, {
      method: 'PUT',
      body: JSON.stringify({ room_id: roomId }),
    });
  }
}

// Singleton instance
export const calendarService = new CalendarService();
