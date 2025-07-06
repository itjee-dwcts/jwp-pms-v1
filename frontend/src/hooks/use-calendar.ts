import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { calendarService } from '../services/calendar-service';
import type {
  CreateEventRequest,
  UpdateEventRequest
} from '../types/calendar';

/**
 * 캘린더 이벤트 관리를 위한 커스텀 훅
 */
export const useCalendar = () => {
  const queryClient = useQueryClient();

  // 이벤트 목록 조회
  const {
    data: events = [],
    isLoading: isLoadingEvents,
    error: eventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['calendar', 'events'],
    queryFn: () => calendarService.getEvents(),
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 특정 기간 이벤트 조회
  const useEventsInRange = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['calendar', 'events', 'range', startDate, endDate],
      queryFn: () => calendarService.getEventsInRange(startDate, endDate),
      enabled: !!startDate && !!endDate,
      staleTime: 5 * 60 * 1000,
    });
  };

  // 특정 이벤트 상세 조회
  const useEvent = (eventId?: string) => {
    return useQuery({
      queryKey: ['calendar', 'events', eventId],
      queryFn: () => calendarService.getEvent(eventId!),
      enabled: !!eventId,
      staleTime: 5 * 60 * 1000,
    });
  };

  // 이벤트 생성
  const createEventMutation = useMutation({
    mutationFn: (eventData: CreateEventRequest) =>
      calendarService.createEvent(eventData),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('이벤트가 성공적으로 생성되었습니다.');
      return newEvent;
    },
    onError: (error: any) => {
      toast.error(error.message || '이벤트 생성에 실패했습니다.');
      throw error;
    },
  });

  // 이벤트 수정
  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, eventData }: { eventId: string; eventData: UpdateEventRequest }) =>
      calendarService.updateEvent(eventId, eventData),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('이벤트가 성공적으로 수정되었습니다.');
      return updatedEvent;
    },
    onError: (error: any) => {
      toast.error(error.message || '이벤트 수정에 실패했습니다.');
      throw error;
    },
  });

  // 이벤트 삭제
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => calendarService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('이벤트가 성공적으로 삭제되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '이벤트 삭제에 실패했습니다.');
      throw error;
    },
  });

  // 이벤트 참여자 관리
  const addAttendeesMutation = useMutation({
    mutationFn: ({ eventId, userIds }: { eventId: string; userIds: string[] }) =>
      calendarService.addAttendees(eventId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('참여자가 추가되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '참여자 추가에 실패했습니다.');
    },
  });

  const removeAttendeesMutation = useMutation({
    mutationFn: ({ eventId, userIds }: { eventId: string; userIds: string[] }) =>
      calendarService.removeAttendees(eventId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('참여자가 제거되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '참여자 제거에 실패했습니다.');
    },
  });

  return {
    // 데이터
    events,
    isLoadingEvents,
    eventsError,

    // 쿼리 훅들
    useEventsInRange,
    useEvent,

    // 액션들
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    addAttendees: addAttendeesMutation.mutateAsync,
    removeAttendees: removeAttendeesMutation.mutateAsync,
    refetchEvents,

    // 로딩 상태
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
    isAddingAttendees: addAttendeesMutation.isPending,
    isRemovingAttendees: removeAttendeesMutation.isPending,
  };
};
