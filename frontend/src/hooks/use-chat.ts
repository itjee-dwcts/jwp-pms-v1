/**
 * 채팅 상태 관리 훅 (React Query)
 *
 * ChatService와 연동하는 채팅 기능을 위한 React Query 기반 훅
 * use-calendar.ts와 동일한 구조 사용
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { chatService } from '../services/chat-service';
import type {
  ChatMessageCreateRequest,
  ChatMessageSearchRequest,
  ChatMessageUpdateRequest,
  ChatSessionCreateRequest,
  ChatSessionSearchRequest,
  ChatSessionUpdateRequest,
  ChatTemplateCreateRequest,
  ChatTemplateSearchRequest,
  ChatTemplateUpdateRequest,
  OpenAIMessageRequest,
} from '../types/chat';

/**
 * 채팅 관리를 위한 커스텀 훅
 */
export const useChat = () => {
  const queryClient = useQueryClient();

  // ============================================================================
  // 채팅 세션 관련 쿼리
  // ============================================================================

  /**
   * 채팅 세션 목록 조회
   */
  const {
    data: sessionsResponse,
    isLoading: isLoadingSessions,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: () => chatService.listChatSessions(),
    staleTime: 5 * 60 * 1000, // 5분
  });

  const sessions = sessionsResponse?.sessions || [];

  /**
   * 특정 조건으로 세션 목록 조회
   */
  const useChatSessions = (params?: ChatSessionSearchRequest) => {
    return useQuery({
      queryKey: ['chat', 'sessions', 'search', params],
      queryFn: () => chatService.listChatSessions(params),
      enabled: !!params,
      staleTime: 5 * 60 * 1000,
      select: (data) => data.sessions, // 배열만 반환
    });
  };

  /**
   * 특정 채팅 세션 상세 조회
   */
  const useChatSession = (sessionId?: string) => {
    return useQuery({
      queryKey: ['chat', 'sessions', sessionId],
      queryFn: () => chatService.getChatSession(sessionId!),
      enabled: !!sessionId,
      staleTime: 5 * 60 * 1000,
    });
  };

  // ============================================================================
  // 채팅 메시지 관련 쿼리
  // ============================================================================

  /**
   * 특정 세션의 메시지 목록 조회
   */
  const useChatMessages = (sessionId?: string, params?: ChatMessageSearchRequest) => {
    return useQuery({
      queryKey: ['chat', 'messages', sessionId, params],
      queryFn: () => chatService.listChatMessages(sessionId!, params),
      enabled: !!sessionId,
      staleTime: 2 * 60 * 1000, // 2분 (메시지는 더 자주 업데이트)
      select: (data) => data.messages, // 배열만 반환
    });
  };

  // ============================================================================
  // 채팅 템플릿 관련 쿼리
  // ============================================================================

  /**
   * 채팅 템플릿 목록 조회
   */
  const {
    data: templatesResponse,
    isLoading: isLoadingTemplates,
    error: templatesError,
    refetch: refetchTemplates
  } = useQuery({
    queryKey: ['chat', 'templates'],
    queryFn: () => chatService.listChatTemplates(),
    staleTime: 10 * 60 * 1000, // 10분
  });

  const templates = templatesResponse?.templates || [];

  /**
   * 특정 조건으로 템플릿 목록 조회
   */
  const useChatTemplates = (params?: ChatTemplateSearchRequest) => {
    return useQuery({
      queryKey: ['chat', 'templates', 'search', params],
      queryFn: () => chatService.listChatTemplates(params),
      enabled: !!params,
      staleTime: 10 * 60 * 1000,
      select: (data) => data.templates, // 배열만 반환
    });
  };

  /**
   * 특정 채팅 템플릿 상세 조회
   */
  const useChatTemplate = (templateId?: string) => {
    return useQuery({
      queryKey: ['chat', 'templates', templateId],
      queryFn: () => chatService.getChatTemplate(templateId!),
      enabled: !!templateId,
      staleTime: 10 * 60 * 1000,
    });
  };

  // ============================================================================
  // 채팅 통계 관련 쿼리
  // ============================================================================

  /**
   * 채팅 사용량 통계 조회
   */
  const useChatUsageStats = (params?: { period_type?: string; days?: number }) => {
    return useQuery({
      queryKey: ['chat', 'usage-stats', params],
      queryFn: () => chatService.getChatUsageStats(params),
      staleTime: 30 * 60 * 1000, // 30분
    });
  };

  /**
   * 채팅 요약 통계 조회
   */
  const useChatSummaryStats = () => {
    return useQuery({
      queryKey: ['chat', 'stats', 'summary'],
      queryFn: () => chatService.getChatSummaryStats(),
      staleTime: 15 * 60 * 1000, // 15분
    });
  };

  /**
   * 채팅 설정 조회
   */
  const useChatSettings = () => {
    return useQuery({
      queryKey: ['chat', 'settings'],
      queryFn: () => chatService.getChatSettings(),
      staleTime: 60 * 60 * 1000, // 1시간
    });
  };

  /**
   * 시스템 상태 조회
   */
  const useChatSystemStatus = () => {
    return useQuery({
      queryKey: ['chat', 'system', 'status'],
      queryFn: () => chatService.getChatSystemStatus(),
      refetchInterval: 30 * 1000, // 30초마다 자동 갱신
      staleTime: 30 * 1000,
    });
  };

  // ============================================================================
  // 세션 관리 뮤테이션
  // ============================================================================

  /**
   * 채팅 세션 생성
   */
  const createSessionMutation = useMutation({
    mutationFn: (sessionData: ChatSessionCreateRequest) =>
      chatService.createChatSession(sessionData),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      toast.success('새로운 채팅이 시작되었습니다.');
      return newSession;
    },
    onError: (error: any) => {
      toast.error(error.message || '채팅 세션 생성에 실패했습니다.');
      throw error;
    },
  });

  /**
   * 채팅 세션 수정
   */
  const updateSessionMutation = useMutation({
    mutationFn: ({ sessionId, sessionData }: { sessionId: string; sessionData: ChatSessionUpdateRequest }) =>
      chatService.updateChatSession(sessionId, sessionData),
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions', updatedSession.id] });
      toast.success('채팅 세션이 성공적으로 수정되었습니다.');
      return updatedSession;
    },
    onError: (error: any) => {
      toast.error(error.message || '채팅 세션 수정에 실패했습니다.');
      throw error;
    },
  });

  /**
   * 채팅 세션 삭제
   */
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => chatService.deleteChatSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      queryClient.removeQueries({ queryKey: ['chat', 'sessions', sessionId] });
      queryClient.removeQueries({ queryKey: ['chat', 'messages', sessionId] });
      toast.success('채팅이 삭제되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '채팅 세션 삭제에 실패했습니다.');
      throw error;
    },
  });

  /**
   * 채팅 세션 복제
   */
  const duplicateSessionMutation = useMutation({
    mutationFn: ({ sessionId, newTitle }: { sessionId: string; newTitle?: string }) =>
      chatService.duplicateChatSession(sessionId, newTitle),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      toast.success('채팅이 복제되었습니다.');
      return newSession;
    },
    onError: (error: any) => {
      toast.error(error.message || '채팅 복제에 실패했습니다.');
    },
  });

  /**
   * 채팅 세션 아카이브
   */
  const archiveSessionMutation = useMutation({
    mutationFn: (sessionId: string) => chatService.archiveChatSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      toast.success('채팅이 아카이브되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '채팅 아카이브에 실패했습니다.');
    },
  });

  /**
   * 채팅 세션 복원
   */
  const restoreSessionMutation = useMutation({
    mutationFn: (sessionId: string) => chatService.restoreChatSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      toast.success('채팅이 복원되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '채팅 복원에 실패했습니다.');
    },
  });

  // ============================================================================
  // 메시지 관리 뮤테이션
  // ============================================================================

  /**
   * AI에게 메시지 전송
   */
  const sendMessageMutation = useMutation({
    mutationFn: (request: OpenAIMessageRequest) =>
      chatService.sendMessageToAI(request),
    onSuccess: (response, request) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', request.session_id] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      // AI 응답 성공 시 알림은 생략 (너무 자주 발생)
      return response;
    },
    onError: (error: any) => {
      toast.error(error.message || 'AI 응답을 받을 수 없습니다.');
      throw error;
    },
  });

  /**
   * 사용자 메시지 생성
   */
  const createMessageMutation = useMutation({
    mutationFn: (messageData: ChatMessageCreateRequest) =>
      chatService.createChatMessage(messageData),
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', newMessage.session_id] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      return newMessage;
    },
    onError: (error: any) => {
      toast.error(error.message || '메시지 생성에 실패했습니다.');
      throw error;
    },
  });

  /**
   * 메시지 수정
   */
  const updateMessageMutation = useMutation({
    mutationFn: ({ messageId, messageData }: { messageId: string; messageData: ChatMessageUpdateRequest }) =>
      chatService.updateChatMessage(messageId, messageData),
    onSuccess: (updatedMessage) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', updatedMessage.session_id] });
      toast.success('메시지가 수정되었습니다.');
      return updatedMessage;
    },
    onError: (error: any) => {
      toast.error(error.message || '메시지 수정에 실패했습니다.');
      throw error;
    },
  });

  /**
   * 메시지 삭제
   */
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatService.deleteChatMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      toast.success('메시지가 삭제되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '메시지 삭제에 실패했습니다.');
    },
  });

  /**
   * 메시지 재생성
   */
  const regenerateMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatService.regenerateMessage(messageId),
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', newMessage.session_id] });
      toast.success('메시지가 재생성되었습니다.');
      return newMessage;
    },
    onError: (error: any) => {
      toast.error(error.message || '메시지 재생성에 실패했습니다.');
    },
  });

  /**
   * 메시지 피드백 전송
   */
  const sendMessageFeedbackMutation = useMutation({
    mutationFn: ({ messageId, feedback }: {
      messageId: string;
      feedback: { rating: 'positive' | 'negative'; comment?: string; categories?: string[] }
    }) =>
      chatService.sendMessageFeedback(messageId, feedback),
    onSuccess: () => {
      toast.success('피드백이 전송되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '피드백 전송에 실패했습니다.');
    },
  });

  // ============================================================================
  // 템플릿 관리 뮤테이션
  // ============================================================================

  /**
   * 채팅 템플릿 생성
   */
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: ChatTemplateCreateRequest) =>
      chatService.createChatTemplate(templateData),
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'templates'] });
      toast.success('템플릿이 생성되었습니다.');
      return newTemplate;
    },
    onError: (error: any) => {
      toast.error(error.message || '템플릿 생성에 실패했습니다.');
      throw error;
    },
  });

  /**
   * 채팅 템플릿 수정
   */
  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, templateData }: { templateId: string; templateData: ChatTemplateUpdateRequest }) =>
      chatService.updateChatTemplate(templateId, templateData),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'templates'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'templates', updatedTemplate.id] });
      toast.success('템플릿이 수정되었습니다.');
      return updatedTemplate;
    },
    onError: (error: any) => {
      toast.error(error.message || '템플릿 수정에 실패했습니다.');
      throw error;
    },
  });

  /**
   * 채팅 템플릿 삭제
   */
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => chatService.deleteChatTemplate(templateId),
    onSuccess: (_, templateId) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'templates'] });
      queryClient.removeQueries({ queryKey: ['chat', 'templates', templateId] });
      toast.success('템플릿이 삭제되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '템플릿 삭제에 실패했습니다.');
    },
  });

  /**
   * 템플릿 사용 횟수 증가
   */
  const incrementTemplateUsageMutation = useMutation({
    mutationFn: (templateId: string) => chatService.incrementTemplateUsage(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'templates'] });
    },
    onError: (error: any) => {
      console.error('템플릿 사용 횟수 증가 실패:', error);
    },
  });

  /**
   * 템플릿 좋아요 토글
   */
  const toggleTemplateLikeMutation = useMutation({
    mutationFn: (templateId: string) => chatService.toggleTemplateLike(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'templates'] });
      toast.success('좋아요가 업데이트되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '좋아요 업데이트에 실패했습니다.');
    },
  });

  // ============================================================================
  // 파일 관리 뮤테이션
  // ============================================================================

  /**
   * 채팅 파일 업로드
   */
  const uploadChatFileMutation = useMutation({
    mutationFn: ({ sessionId, file, description }: { sessionId: string; file: File; description?: string }) =>
      chatService.uploadChatFile(sessionId, file, description),
    onSuccess: (fileInfo, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'files', sessionId] });
      toast.success('파일이 업로드되었습니다.');
      return fileInfo;
    },
    onError: (error: any) => {
      toast.error(error.message || '파일 업로드에 실패했습니다.');
    },
  });

  /**
   * 채팅 파일 삭제
   */
  const deleteChatFileMutation = useMutation({
    mutationFn: ({ sessionId, fileId }: { sessionId: string; fileId: string }) =>
      chatService.deleteChatFile(sessionId, fileId),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'files', sessionId] });
      toast.success('파일이 삭제되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.message || '파일 삭제에 실패했습니다.');
    },
  });

  // ============================================================================
  // 기타 유틸리티 뮤테이션
  // ============================================================================

  /**
   * 대화 요약 생성
   */
  const generateConversationSummaryMutation = useMutation({
    mutationFn: (sessionId: string) => chatService.generateConversationSummary(sessionId),
    onSuccess: (summary) => {
      toast.success('대화 요약이 생성되었습니다.');
      return summary;
    },
    onError: (error: any) => {
      toast.error(error.message || '대화 요약 생성에 실패했습니다.');
    },
  });

  /**
   * 채팅 검색
   */
  const searchChatMutation = useMutation({
    mutationFn: (params: {
      query: string;
      session_ids?: string[];
      start_date?: string;
      end_date?: string;
      message_roles?: string[];
      page_no?: number;
      page_size?: number;
    }) => chatService.searchChatGlobally(params),
    onError: (error: any) => {
      toast.error(error.message || '검색에 실패했습니다.');
    },
  });

  // ============================================================================
  // 반환값 (API)
  // ============================================================================

  return {
    // 데이터
    sessions,
    templates,
    isLoadingSessions,
    isLoadingTemplates,
    sessionsError,
    templatesError,

    // 쿼리 훅들
    useChatSessions,
    useChatSession,
    useChatMessages,
    useChatTemplates,
    useChatTemplate,
    useChatUsageStats,
    useChatSummaryStats,
    useChatSettings,
    useChatSystemStatus,

    // 세션 관리 액션
    createSession: createSessionMutation.mutateAsync,
    updateSession: updateSessionMutation.mutateAsync,
    deleteSession: deleteSessionMutation.mutateAsync,
    duplicateSession: duplicateSessionMutation.mutateAsync,
    archiveSession: archiveSessionMutation.mutateAsync,
    restoreSession: restoreSessionMutation.mutateAsync,
    refetchSessions,

    // 메시지 관리 액션
    sendMessage: sendMessageMutation.mutateAsync,
    createMessage: createMessageMutation.mutateAsync,
    updateMessage: updateMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    regenerateMessage: regenerateMessageMutation.mutateAsync,
    sendMessageFeedback: sendMessageFeedbackMutation.mutateAsync,

    // 템플릿 관리 액션
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    incrementTemplateUsage: incrementTemplateUsageMutation.mutateAsync,
    toggleTemplateLike: toggleTemplateLikeMutation.mutateAsync,
    refetchTemplates,

    // 파일 관리 액션
    uploadChatFile: uploadChatFileMutation.mutateAsync,
    deleteChatFile: deleteChatFileMutation.mutateAsync,

    // 기타 액션
    generateConversationSummary: generateConversationSummaryMutation.mutateAsync,
    searchChat: searchChatMutation.mutateAsync,

    // 로딩 상태들
    isCreatingSession: createSessionMutation.isPending,
    isUpdatingSession: updateSessionMutation.isPending,
    isDeletingSession: deleteSessionMutation.isPending,
    isDuplicatingSession: duplicateSessionMutation.isPending,
    isArchivingSession: archiveSessionMutation.isPending,
    isRestoringSession: restoreSessionMutation.isPending,

    isSendingMessage: sendMessageMutation.isPending,
    isCreatingMessage: createMessageMutation.isPending,
    isUpdatingMessage: updateMessageMutation.isPending,
    isDeletingMessage: deleteMessageMutation.isPending,
    isRegeneratingMessage: regenerateMessageMutation.isPending,
    isSendingFeedback: sendMessageFeedbackMutation.isPending,

    isCreatingTemplate: createTemplateMutation.isPending,
    isUpdatingTemplate: updateTemplateMutation.isPending,
    isDeletingTemplate: deleteTemplateMutation.isPending,
    isIncrementingUsage: incrementTemplateUsageMutation.isPending,
    isTogglingLike: toggleTemplateLikeMutation.isPending,

    isUploadingFile: uploadChatFileMutation.isPending,
    isDeletingFile: deleteChatFileMutation.isPending,

    isGeneratingSummary: generateConversationSummaryMutation.isPending,
    isSearching: searchChatMutation.isPending,
  };
};

// ============================================================================
// 편의 훅들
// ============================================================================

/**
 * 특정 세션의 채팅 관리 훅
 */
export const useChatSession = (sessionId: string) => {
  const {
    useChatSession: useSessionQuery,
    useChatMessages,
    sendMessage,
    createMessage,
    deleteMessage,
    uploadChatFile,
    deleteChatFile,
    generateConversationSummary,
    isSendingMessage,
    isCreatingMessage,
    isDeletingMessage,
    isUploadingFile,
    isDeletingFile,
    isGeneratingSummary,
  } = useChat();

  const sessionQuery = useSessionQuery(sessionId);
  const messagesQuery = useChatMessages(sessionId);

  /**
   * 세션의 파일 목록 조회
   */
  const filesQuery = useQuery({
    queryKey: ['chat', 'files', sessionId],
    queryFn: () => chatService.listChatFiles(sessionId),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    // 데이터
    session: sessionQuery.data,
    messages: messagesQuery.data || [],
    files: filesQuery.data?.files || [],

    // 로딩 상태
    isLoadingSession: sessionQuery.isLoading,
    isLoadingMessages: messagesQuery.isLoading,
    isLoadingFiles: filesQuery.isLoading,

    // 에러
    sessionError: sessionQuery.error,
    messagesError: messagesQuery.error,
    filesError: filesQuery.error,

    // 액션들
    sendMessage: (request: Omit<OpenAIMessageRequest, 'session_id'>) =>
      sendMessage({ ...request, session_id: sessionId }),
    createMessage: (data: Omit<ChatMessageCreateRequest, 'session_id'>) =>
      createMessage({ ...data, session_id: sessionId }),
    deleteMessage,
    uploadFile: (file: File, description?: string) =>
      uploadChatFile(
        description !== undefined
          ? { sessionId, file, description }
          : { sessionId, file }
      ),
    deleteFile: (fileId: string) =>
      deleteChatFile({ sessionId, fileId }),
    generateSummary: () => generateConversationSummary(sessionId),

    // 로딩 상태
    isSendingMessage,
    isCreatingMessage,
    isDeletingMessage,
    isUploadingFile,
    isDeletingFile,
    isGeneratingSummary,

    // 새로고침
    refetchSession: sessionQuery.refetch,
    refetchMessages: messagesQuery.refetch,
    refetchFiles: filesQuery.refetch,
  };
};

/**
 * 채팅 통계 훅
 */
export const useChatStatistics = () => {
  const { useChatSummaryStats, useChatUsageStats } = useChat();

  const summaryQuery = useChatSummaryStats();
  const usageQuery = useChatUsageStats({ period_type: 'daily', days: 30 });

  return {
    summary: summaryQuery.data,
    usage: usageQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    isLoadingUsage: usageQuery.isLoading,
    summaryError: summaryQuery.error,
    usageError: usageQuery.error,
    refetchSummary: summaryQuery.refetch,
    refetchUsage: usageQuery.refetch,
  };
};

/**
 * 채팅 템플릿 관리 훅
 */
export const useChatTemplateManager = () => {
  const {
    templates,
    isLoadingTemplates,
    templatesError,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementTemplateUsage,
    toggleTemplateLike,
    refetchTemplates,
    isCreatingTemplate,
    isUpdatingTemplate,
    isDeletingTemplate,
    isIncrementingUsage,
    isTogglingLike,
  } = useChat();

  /**
   * 템플릿 사용 (사용 횟수 증가 + 내용 반환)
   */
  const useTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      await incrementTemplateUsage(templateId);
      return template.content;
    }
    throw new Error('템플릿을 찾을 수 없습니다.');
  };

  return {
    templates,
    isLoadingTemplates,
    templatesError,

    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    toggleTemplateLike,
    refetchTemplates,

    isCreatingTemplate,
    isUpdatingTemplate,
    isDeletingTemplate,
    isIncrementingUsage,
    isTogglingLike,
  };
};
