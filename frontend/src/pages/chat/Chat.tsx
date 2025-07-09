/**
 * 채팅 페이지 컴포넌트
 *
 * ChatGPT와 유사한 UI로 구성된 채팅 인터페이스
 */

import {
  ArrowUpIcon,
  Bars3Icon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
  PlusIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkIconSolid,
  HeartIcon as HeartIconSolid,
} from '@heroicons/react/24/solid';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import DropdownMenu from '../../components/ui/DropdownMenu';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  useChat
} from '../../hooks/use-chat';
import {
  ChatSessionCreateRequest,
  MESSAGE_ROLE,
  OPENAI_MODEL,
  OpenAIMessageRequest,
} from '../../types/chat';

/**
 * 채팅 메인 페이지 컴포넌트
 */
const Chat: React.FC = () => {
  // use-chat 훅 사용
  const {
    // 데이터
    sessions,
    // templates,

    // 로딩 상태
    isLoadingSessions,
    // isLoadingTemplates,

    // 에러 상태
    // sessionsError,
    // templatesError,

    // 뮤테이션 함수들
    createSession,
    updateSession,
    deleteSession,
    sendMessage,

    // 뮤테이션 로딩 상태
    isCreatingSession,
    // isUpdatingSession,
    // isDeletingSession,
    // isSendingMessage,

    // 기타 함수들
    refetchSessions,
    refetchTemplates,
  } = useChat();

  // const templateManager = useChatTemplateManager();

  // 로컬 상태
  const [messageInput, setMessageInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 기본 설정 상태
  const [settings, setSettings] = useState({
    default_model: OPENAI_MODEL.GPT_3_5_TURBO,
    default_temperature: '0.7',
    default_max_tokens: 2000,
    auto_save: true,
    sound_enabled: true,
    typing_indicator: true,
    message_timestamp: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 현재 세션과 메시지 찾기
  const currentSession = sessions.find(session => session.id === currentSessionId);
  const messages = currentMessages; // 임시로 로컬 상태 사용

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);

        // 세션 목록 로드
        await refetchSessions();

        // 템플릿 목록 로드
        await refetchTemplates();

        setIsLoading(false);
      } catch (error) {
        console.error('채팅 초기화 실패:', error);
        setErrorMessage('채팅을 초기화할 수 없습니다.');
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [refetchSessions, refetchTemplates]);

  // 세션 목록이 로드되면 첫 번째 세션 선택
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId && sessions[0]) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  // 세션 변경 시 메시지 로드
  useEffect(() => {
    if (currentSessionId) {
      // TODO: 실제 메시지 로드 로직 구현
      // const { data: messages } = useChatMessages(currentSessionId);
      // setCurrentMessages(messages || []);
      setCurrentMessages([]); // 임시로 빈 배열 설정
    }
  }, [currentSessionId]);

  /**
   * 새로운 채팅 세션 생성
   */
  const handleCreateNewSession = async () => {
    try {
      const sessionData: ChatSessionCreateRequest = {
        title: '새 채팅',
        model: settings.default_model,
        temperature: settings.default_temperature,
        max_tokens: settings.default_max_tokens,
        tags: [],
      };

      const newSession = await createSession(sessionData);
      setCurrentSessionId(newSession.id);
      setCurrentMessages([]);
      setMessageInput('');
      toast.success('새 채팅이 시작되었습니다.');
    } catch (error) {
      console.error('새 세션 생성 실패:', error);
      toast.error('새 채팅을 시작할 수 없습니다.');
    }
  };

  /**
   * 메시지 전송
   */
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentSession || isTyping) {
      return;
    }

    const message = messageInput.trim();
    setMessageInput('');
    setIsTyping(true);

    try {
      const request: OpenAIMessageRequest = {
        session_id: currentSession.id,
        message: message,
        stream: false,
      };

      await sendMessage(request);

      // 메시지 목록 새로고침
      // TODO: 실제 메시지 새로고침 로직 구현

    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setMessageInput(message);
      toast.error('메시지를 전송할 수 없습니다.');
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * 메시지 목록 끝으로 스크롤
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 메시지 목록 끝으로 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 에러 메시지 표시
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      setErrorMessage(null);
    }
  }, [errorMessage]);

  // 입력 필드 자동 높이 조절
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [messageInput]);

  /**
   * Enter 키 처리 (Shift+Enter는 줄바꿈, Enter는 전송)
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * 세션 선택
   */
  const handleSessionSelect = async (sessionId: string) => {
    if (sessionId === currentSession?.id) return;

    try {
      setCurrentSessionId(sessionId);
      // TODO: 실제 세션 선택 로직 구현
    } catch (error) {
      console.error('세션 선택 실패:', error);
      toast.error('채팅을 선택할 수 없습니다.');
    }
  };

  /**
   * 세션 제목 수정 시작
   */
  const handleStartEditTitle = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  /**
   * 세션 제목 수정 완료
   */
  const handleFinishEditTitle = async () => {
    if (!editingSessionId || !editingTitle.trim()) {
      setEditingSessionId(null);
      setEditingTitle('');
      return;
    }

    try {
      await updateSession({ sessionId: editingSessionId, sessionData: { title: editingTitle.trim() } });
      setEditingSessionId(null);
      setEditingTitle('');
      toast.success('제목이 수정되었습니다.');
    } catch (error) {
      console.error('제목 수정 실패:', error);
      toast.error('제목을 수정할 수 없습니다.');
    }
  };

  /**
   * 세션 제목 수정 취소
   */
  const handleCancelEditTitle = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  /**
   * 세션 즐겨찾기 토글
   */
  const handleToggleFavorite = async (sessionId: string, isFavorite: boolean) => {
    try {
      await updateSession({ sessionId, sessionData: { is_favorite: !isFavorite } });
      toast.success(isFavorite ? '즐겨찾기에서 제거했습니다.' : '즐겨찾기에 추가했습니다.');
    } catch (error) {
      console.error('즐겨찾기 업데이트 실패:', error);
      toast.error('즐겨찾기를 업데이트할 수 없습니다.');
    }
  };

  /**
   * 세션 고정 토글
   */
  const handleTogglePin = async (sessionId: string, isPinned: boolean) => {
    try {
      await updateSession({ sessionId, sessionData: { is_pinned: !isPinned } });
      toast.success(isPinned ? '고정을 해제했습니다.' : '고정했습니다.');
    } catch (error) {
      console.error('고정 상태 업데이트 실패:', error);
      toast.error('고정 상태를 업데이트할 수 없습니다.');
    }
  };

  /**
   * 세션 삭제
   */
  const handleSessionDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast.success('채팅이 삭제되었습니다.');

      // 현재 세션이 삭제된 경우 다른 세션 선택
      if (currentSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setCurrentSessionId(remainingSessions.length > 0 && remainingSessions[0] ? remainingSessions[0].id : null);
      }
    } catch (error) {
      console.error('세션 삭제 실패:', error);
      toast.error('채팅을 삭제할 수 없습니다.');
    }
  };

  /**
   * 파일 첨부 처리
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // TODO: 파일 업로드 로직 구현
    toast('파일 업로드 기능은 준비 중입니다.');
  };

  /**
   * 메시지 역할에 따른 스타일 반환
   */
  const getMessageStyle = (role: string) => {
    switch (role) {
      case MESSAGE_ROLE.USER:
        return {
          container: 'justify-end',
          bubble: 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl',
          avatar: 'bg-blue-500',
          text: 'U',
        };
      case MESSAGE_ROLE.ASSISTANT:
        return {
          container: 'justify-start',
          bubble: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-r-xl rounded-tl-xl',
          avatar: 'bg-green-500',
          text: 'AI',
        };
      default:
        return {
          container: 'justify-center',
          bubble: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-xl',
          avatar: 'bg-yellow-500',
          text: 'S',
        };
    }
  };

  /**
   * 시간 포맷팅
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  /**
   * 메시지 길이에 따른 글자 수 표시 색상
   */
  const getCharCountColor = (length: number) => {
    if (length > 3500) return 'text-red-500';
    if (length > 3000) return 'text-yellow-500';
    return 'text-gray-500 dark:text-gray-400';
  };

  /**
   * 설정 업데이트 함수
   */
  const updateSettings = (newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  /**
   * 설정 리셋 함수
   */
  const resetSettings = () => {
    setSettings({
      default_model: OPENAI_MODEL.GPT_3_5_TURBO,
      default_temperature: '0.7',
      default_max_tokens: 2000,
      auto_save: true,
      sound_enabled: true,
      typing_indicator: true,
      message_timestamp: true,
    });
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* 사이드바 */}
      <div
        className={classNames(
          'transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0',
          isSidebarOpen ? 'w-80' : 'w-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* 사이드바 헤더 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCreateNewSession}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={isCreatingSession}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              새 채팅
            </button>
          </div>

          {/* 세션 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={classNames(
                  'group relative rounded-lg cursor-pointer transition-all duration-200',
                  currentSession?.id === session.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                )}
              >
                <div
                  className="p-3"
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      {/* 세션 제목 */}
                      {editingSessionId === session.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={handleFinishEditTitle}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleFinishEditTitle();
                            if (e.key === 'Escape') handleCancelEditTitle();
                          }}
                          className="w-full text-sm font-medium bg-transparent border-none outline-none text-gray-900 dark:text-white"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          placeholder="세션 제목 입력"
                          title="세션 제목 입력"
                        />
                      ) : (
                        <p
                          className={classNames(
                            'text-sm font-medium truncate',
                            currentSession?.id === session.id
                              ? 'text-blue-900 dark:text-blue-100'
                              : 'text-gray-900 dark:text-white'
                          )}
                        >
                          {session.title}
                        </p>
                      )}

                      {/* 세션 정보 */}
                      <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{session.message_count || 0}개 메시지</span>
                        <span>•</span>
                        <span>{formatTime(session.last_activity_at || session.created_at)}</span>
                      </div>

                      {/* 태그 및 상태 */}
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">
                          {session.model}
                        </span>
                        {session.is_pinned && (
                          <BookmarkIconSolid className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        )}
                        {session.is_favorite && (
                          <HeartIconSolid className="w-3 h-3 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </div>

                    {/* 세션 액션 메뉴 */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu
                        trigger={
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                            title="세션 메뉴"
                          >
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </button>
                        }
                        items={[
                          {
                            label: '제목 수정',
                            onClick: () => handleStartEditTitle(session.id, session.title),
                          },
                          {
                            label: session.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가',
                            onClick: () => handleToggleFavorite(session.id, session.is_favorite),
                          },
                          {
                            label: session.is_pinned ? '고정 해제' : '고정',
                            onClick: () => handleTogglePin(session.id, session.is_pinned),
                          },
                          { type: 'divider' },
                          {
                            label: '삭제',
                            onClick: () => handleSessionDelete(session.id),
                            className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
                          },
                        ]}
                        position="left"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {sessions.length === 0 && !isLoadingSessions && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="font-medium mb-1">채팅이 없습니다</p>
                <p className="text-sm">새 채팅을 시작해보세요!</p>
              </div>
            )}
          </div>

          {/* 사이드바 하단 설정 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RectangleStackIcon className="w-4 h-4 mr-1" />
                템플릿
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Cog6ToothIcon className="w-4 h-4 mr-1" />
                설정
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 채팅 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="사이드바 열기/닫기"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentSession?.title || '채팅을 선택하세요'}
                </h1>
                {currentSession && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentSession.model} • {currentSession.message_count || 0}개 메시지
                    {currentSession.total_tokens && currentSession.total_tokens > 0 && (
                      <> • {currentSession.total_tokens.toLocaleString()} 토큰</>
                    )}
                  </p>
                )}
              </div>
            </div>

            {currentSession && (
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>비용: ${currentSession.total_cost || '0.00'}</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>온라인</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {!currentSession ? (
              /* 세션 미선택 상태 */
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    AI 채팅에 오신 것을 환영합니다!
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                    새 채팅을 시작하거나 기존 채팅을 선택해주세요.
                    OpenAI의 최신 모델과 대화할 수 있습니다.
                  </p>
                  <button
                    onClick={handleCreateNewSession}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    새 채팅 시작
                  </button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              /* 메시지 없는 상태 */
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    무엇을 도와드릴까요?
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    궁금한 것이 있으시면 언제든 물어보세요!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                    {[
                      '프로젝트 관리 방법을 알려주세요',
                      'Python 코드를 검토해주세요',
                      '마케팅 전략을 제안해주세요',
                      '데이터 분석 도움이 필요해요',
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setMessageInput(suggestion)}
                        className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* 메시지 목록 */
              <div className="space-y-6">
                {messages.map((message, index) => {
                  const style = getMessageStyle(message.role);
                  return (
                    <div key={message.id || index} className={`flex ${style.container}`}>
                      <div className="flex items-start space-x-3 max-w-4xl">
                        {/* 아바타 */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${style.avatar}`}>
                          {style.text}
                        </div>

                        {/* 메시지 버블 */}
                        <div className="flex-1 min-w-0">
                          <div className={`px-4 py-3 ${style.bubble} shadow-sm`}>
                            <div className="whitespace-pre-wrap break-words">{message.content}</div>
                          </div>

                          {/* 메시지 정보 */}
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatTime(message.created_at || new Date().toISOString())}</span>
                            <div className="flex items-center space-x-3">
                              {message.tokens_used && (
                                <span>토큰: {message.tokens_used.toLocaleString()}</span>
                              )}
                              {message.response_time && (
                                <span>{message.response_time}ms</span>
                              )}
                              {message.cost && (
                                <span>${message.cost}</span>
                              )}
                              {message.is_edited && <span>수정됨</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 타이핑 인디케이터 */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3 max-w-4xl">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                        AI
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-r-xl rounded-tl-xl px-4 py-3 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* 메시지 입력 영역 */}
        {currentSession && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative flex items-end space-x-3">
                {/* 파일 첨부 버튼 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                  disabled={isTyping || isLoading}
                  title="파일 첨부"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>

                {/* 숨겨진 파일 입력 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  title="파일 첨부"
                  placeholder="파일을 선택하세요"
                />

                {/* 메시지 입력 필드 */}
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                    className="w-full max-h-32 p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    rows={1}
                    disabled={isTyping || isLoading}
                    style={{
                      minHeight: '48px',
                      height: 'auto',
                    }}
                  />

                  {/* 전송 버튼 */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isTyping || isLoading}
                    className={classNames(
                      'absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200',
                      messageInput.trim() && !isTyping && !isLoading
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    )}
                  >
                    {isTyping || isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <ArrowUpIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>모델: {currentSession.model}</span>
                  <span>온도: {currentSession.temperature}</span>
                  <span>최대 토큰: {currentSession.max_tokens.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  {messageInput.length > 0 && (
                    <span className={getCharCountColor(messageInput.length)}>
                      {messageInput.length.toLocaleString()}/4,000
                    </span>
                  )}
                  <span className="text-gray-400">
                    Shift+Enter로 줄바꿈
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center space-x-3 shadow-xl">
            <LoadingSpinner size="md" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">처리 중...</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">잠시만 기다려주세요</div>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 모달 */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">템플릿</h2>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <RectangleStackIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>템플릿 기능은 준비 중입니다.</p>
                <p className="text-sm mt-1">곧 다양한 프롬프트 템플릿을 제공할 예정입니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 설정 모달 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">채팅 설정</h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* 기본 모델 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  기본 모델
                </label>
                <select
                  id="default-model-select"
                  title="기본 모델 선택"
                  value={settings.default_model}
                  onChange={(e) => updateSettings({ default_model: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={OPENAI_MODEL.GPT_3_5_TURBO}>GPT-3.5 Turbo</option>
                  <option value={OPENAI_MODEL.GPT_4}>GPT-4</option>
                  <option value={OPENAI_MODEL.GPT_4_TURBO}>GPT-4 Turbo</option>
                  <option value={OPENAI_MODEL.GPT_4_VISION}>GPT-4 Vision</option>
                </select>
              </div>

              {/* 기본 온도 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  기본 온도: {settings.default_temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={parseFloat(settings.default_temperature)}
                  onChange={(e) => updateSettings({ default_temperature: e.target.value })}
                  className="w-full"
                  title="기본 온도 슬라이더"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>정확함 (0)</span>
                  <span>창의적 (2)</span>
                </div>
              </div>

              {/* 기본 최대 토큰 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  기본 최대 토큰
                </label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  step="100"
                  value={settings.default_max_tokens}
                  onChange={(e) => updateSettings({ default_max_tokens: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  title="기본 최대 토큰 입력"
                  placeholder="최대 토큰 수를 입력하세요"
                />
              </div>

              {/* 기타 설정들 */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.auto_save}
                    onChange={(e) => updateSettings({ auto_save: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">자동 저장</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.sound_enabled}
                    onChange={(e) => updateSettings({ sound_enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">알림 소리</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.typing_indicator}
                    onChange={(e) => updateSettings({ typing_indicator: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">입력 표시기</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.message_timestamp}
                    onChange={(e) => updateSettings({ message_timestamp: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">메시지 시간 표시</span>
                </label>
              </div>

              {/* 설정 리셋 버튼 */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    resetSettings();
                    toast.success('설정이 초기화되었습니다.');
                  }}
                  className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  설정 초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
