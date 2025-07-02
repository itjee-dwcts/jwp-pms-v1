// ============================================================================
// EventDetail.tsx - 이벤트 상세 페이지
// ============================================================================

import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/use-auth';
import { useCalendar } from '@/hooks/use-calendar';

const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useEvent, deleteEvent, isDeleting } = useCalendar();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 이벤트 데이터 조회
  const {
    data: event,
    isLoading,
    error,
  } = useEvent(eventId);

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!eventId) return;

    try {
      await deleteEvent(eventId);
      toast.success('이벤트가 삭제되었습니다');
      navigate('/calendar');
    } catch (error) {
      console.error('이벤트 삭제 오류:', error);
      toast.error('이벤트 삭제에 실패했습니다');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // 상태에 따른 배지 색상
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

  // 이벤트 유형 한글 변환
  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting':
        return '회의';
      case 'deadline':
        return '마감일';
      case 'milestone':
        return '마일스톤';
      case 'reminder':
        return '알림';
      case 'personal':
        return '개인';
      default:
        return type;
    }
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
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
            variant="outline"
            size="sm"
            onClick={() => navigate('/calendar')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              이벤트 상세
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              일정 정보를 확인하세요
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/calendar/events/${eventId}/edit`)}
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            수정
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {event.title}
                </h2>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusBadgeColor(event.status)}>
                    {event.status === 'confirmed' ? '확정' :
                     event.status === 'tentative' ? '미정' : '취소'}
                  </Badge>
                  <Badge className={getPriorityBadgeColor(event.priority)}>
                    {event.priority === 'high' ? '높음' :
                     event.priority === 'medium' ? '보통' : '낮음'}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {getEventTypeLabel(event.type)}
                  </Badge>
                </div>
              </div>
            </div>

            {event.description && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설명
                </h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </Card>

          {/* 일시 정보 */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              일시 정보
            </h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    시작: {new Date(event.start_date).toLocaleString('ko-KR')}
                  </p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    종료: {new Date(event.end_date).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>

              {event.all_day && (
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    종일 이벤트
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* 위치 및 링크 */}
          {(event.location || event.url) && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                위치 및 링크
              </h3>

              <div className="space-y-3">
                {event.location && (
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {event.location}
                    </p>
                  </div>
                )}

                {event.url && (
                  <div className="flex items-center space-x-3">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {event.url}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 참여자 */}
          {event.attendees && event.attendees.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                <UserGroupIcon className="h-5 w-5 inline mr-2" />
                참여자 ({event.attendees.length}명)
              </h3>

              <div className="space-y-2">
                {event.attendees.map((attendee: any) => (
                  <div key={attendee.user_id} className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {attendee.user?.full_name?.[0] || attendee.user?.username?.[0] || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {attendee.user?.full_name || attendee.user?.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {attendee.status === 'accepted' ? '참석' :
                         attendee.status === 'declined' ? '불참' : '미정'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 알림 설정 */}
          {event.reminder_minutes && event.reminder_minutes.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                <ClockIcon className="h-5 w-5 inline mr-2" />
                알림 설정
              </h3>

              <div className="space-y-2">
                {event.reminder_minutes.map((minutes: number, index: number) => (
                  <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    {minutes < 60
                      ? `${minutes}분 전`
                      : minutes < 1440
                      ? `${Math.floor(minutes / 60)}시간 전`
                      : `${Math.floor(minutes / 1440)}일 전`
                    }
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 메타데이터 */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              정보
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">생성일:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(event.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">수정일:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(event.updated_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">공개 범위:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {event.visibility === 'public' ? '공개' :
                   event.visibility === 'private' ? '비공개' : '기밀'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="이벤트 삭제"
        message="이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        loading={isDeleting}
        type="danger"
      />
    </div>
  );
};

export default EventDetail;
