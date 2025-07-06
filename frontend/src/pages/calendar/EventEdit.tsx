// ============================================================================
// EventEdit.tsx - 이벤트 수정 페이지
// ============================================================================

import {
  ArrowLeftIcon,
  ClockIcon,
  LinkIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useCalendar } from '../../hooks/use-calendar';
import { useUsers } from '../../hooks/use-users';
import type { UpdateEventRequest } from '../../types/calendar';

interface EventFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  type: string; //'meeting' | 'deadline' | 'milestone' | 'reminder' | 'personal';
  status: string; //'confirmed' | 'tentative' | 'cancelled';
  priority: string; //'low' | 'medium' | 'high';
  location: string;
  url: string;
  attendee_ids: string[];
  reminder_minutes: number[];
  visibility: string; //'public' | 'private' | 'confidential';
}

/**
 * ISO 날짜 문자열을 datetime-local input에 적합한 형식으로 변환
 */
const formatDateForInput = (isoDateString: string): string => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  return date.toISOString().slice(0, 16);
};

const EventEdit: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { useEvent, updateEvent, isUpdating } = useCalendar();
  const { users } = useUsers();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    all_day: false,
    type: 'meeting',
    status: 'confirmed',
    priority: 'medium',
    location: '',
    url: '',
    attendee_ids: [],
    reminder_minutes: [10],
    visibility: 'public',
  });

  const [errors, setErrors] = useState<Partial<EventFormData>>({});

  // 이벤트 데이터 조회
  const {
    data: event,
    isLoading,
    error,
  } = useEvent(eventId);

  // 이벤트 데이터로 폼 초기화
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_date: formatDateForInput(event.start_date),
        end_date: formatDateForInput(event.end_date),
        all_day: event.all_day || false,
        type: event.type || 'meeting',
        status: event.status || 'confirmed',
        priority: event.priority || 'medium',
        location: event.location || '',
        url: event.url || '',
        attendee_ids: event.attendees?.map((a: any) => a.user_id.toString()) || [],
        reminder_minutes: event.reminder_minutes || [10],
        visibility: event.visibility || 'public',
      });
    }
  }, [event]);

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Partial<EventFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목은 필수입니다';
    }

    if (!formData.start_date) {
      newErrors.start_date = '시작 일시는 필수입니다';
    }

    if (!formData.end_date) {
      newErrors.end_date = '종료 일시는 필수입니다';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate <= startDate) {
        newErrors.end_date = '종료 일시는 시작 일시보다 늦어야 합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !eventId) {
      return;
    }

    try {
      const updateData: UpdateEventRequest = {
        ...formData,
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      await updateEvent({ eventId, eventData: updateData });
      toast.success('이벤트가 성공적으로 수정되었습니다');
      navigate(`/calendar/events/${eventId}`);
    } catch (error) {
      console.error('이벤트 수정 오류:', error);
      toast.error('이벤트 수정에 실패했습니다');
    }
  };

  // 입력 값 변경 핸들러
  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 참여자 토글
  const toggleAttendee = (userId: string) => {
    const currentAttendees = formData.attendee_ids;
    const isSelected = currentAttendees.includes(userId);

    if (isSelected) {
      handleInputChange('attendee_ids', currentAttendees.filter(id => id !== userId));
    } else {
      handleInputChange('attendee_ids', [...currentAttendees, userId]);
    }
  };

  // 알림 시간 추가/제거
  const addReminder = () => {
    handleInputChange('reminder_minutes', [...formData.reminder_minutes, 10]);
  };

  const removeReminder = (index: number) => {
    const newReminders = [...formData.reminder_minutes];
    newReminders.splice(index, 1);
    handleInputChange('reminder_minutes', newReminders);
  };

  const updateReminder = (index: number, minutes: number) => {
    const newReminders = [...formData.reminder_minutes];
    newReminders[index] = minutes;
    handleInputChange('reminder_minutes', newReminders);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorMessage
          message="이벤트를 불러올 수 없습니다"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // 이벤트가 없는 경우
  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            이벤트를 찾을 수 없습니다
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            요청하신 이벤트가 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <Button onClick={() => navigate('/calendar')}>
            캘린더로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/calendar/events/${eventId}`)}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              이벤트 수정
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              일정 정보를 수정하세요
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                기본 정보
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    제목 *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="이벤트 제목을 입력하세요"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="이벤트에 대한 상세 설명"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      유형
                    </label>
                    <select
                      id="event-type-select"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="meeting">회의</option>
                      <option value="deadline">마감일</option>
                      <option value="milestone">마일스톤</option>
                      <option value="reminder">알림</option>
                      <option value="personal">개인</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="event-priority-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      우선순위
                    </label>
                    <select
                      id="event-priority-select"
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="low">낮음</option>
                      <option value="medium">보통</option>
                      <option value="high">높음</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* 일시 정보 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                일시 정보
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="all_day"
                    checked={formData.all_day}
                    onChange={(e) => handleInputChange('all_day', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="all_day" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    종일 이벤트
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      시작 일시 *
                    </label>
                    <Input
                      type={formData.all_day ? "date" : "datetime-local"}
                      value={formData.all_day ? formData.start_date.split('T')[0] : formData.start_date}
                      onChange={(e) => {
                        const value = formData.all_day ? `${e.target.value}T00:00` : e.target.value;
                        handleInputChange('start_date', value);
                      }}
                      className={errors.start_date ? 'border-red-500' : ''}
                    />
                    {errors.start_date && (
                      <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      종료 일시 *
                    </label>
                    <Input
                      type={formData.all_day ? "date" : "datetime-local"}
                      value={formData.all_day ? formData.end_date.split('T')[0] : formData.end_date}
                      onChange={(e) => {
                        const value = formData.all_day ? `${e.target.value}T23:59` : e.target.value;
                        handleInputChange('end_date', value);
                      }}
                      className={errors.end_date ? 'border-red-500' : ''}
                    />
                    {errors.end_date && (
                      <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 위치 및 링크 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                위치 및 링크
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    위치
                  </label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="회의실, 주소 등"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <LinkIcon className="h-4 w-4 inline mr-1" />
                    URL
                  </label>
                  <Input
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 참여자 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                <UserGroupIcon className="h-5 w-5 inline mr-2" />
                참여자
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={formData.attendee_ids.includes(user.id.toString())}
                      onChange={() => toggleAttendee(user.id.toString())}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {user.full_name || user.username}
                    </label>
                  </div>
                ))}
              </div>
            </Card>

            {/* 알림 설정 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                <ClockIcon className="h-5 w-5 inline mr-2" />
                알림 설정
              </h3>

              <div className="space-y-2">
                {formData.reminder_minutes.map((minutes, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={minutes}
                      onChange={(e) => updateReminder(index, parseInt(e.target.value))}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      id={`reminder-select-${index}`}
                    >
                      <option value={5}>5분 전</option>
                      <option value={10}>10분 전</option>
                      <option value={15}>15분 전</option>
                      <option value={30}>30분 전</option>
                      <option value={60}>1시간 전</option>
                      <option value={1440}>1일 전</option>
                    </select>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => removeReminder(index)}
                      disabled={formData.reminder_minutes.length === 1}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={addReminder}
                  className="w-full"
                >
                  알림 추가
                </Button>
              </div>
            </Card>

            {/* 기타 설정 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                기타 설정
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="event-status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    상태
                  </label>
                  <select
                    id="event-status-select"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="confirmed">확정</option>
                    <option value="tentative">미정</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="event-visibility-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    공개 범위
                  </label>
                <select
                    id="event-visibility-select"
                    value={formData.visibility}
                    onChange={(e) => handleInputChange('visibility', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="public">공개</option>
                    <option value="private">비공개</option>
                    <option value="confidential">기밀</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="default"
            onClick={() => navigate(`/calendar/events/${eventId}`)}
            disabled={isUpdating}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                수정 중...
              </>
            ) : (
              '이벤트 수정'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventEdit;
