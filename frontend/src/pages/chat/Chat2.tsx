/**
 * 채팅 페이지 컴포넌트 - Goover.ai 스타일
 *
 * 현대적이고 세련된 UI로 구성된 채팅 인터페이스
 */

import {
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon as ChatIconSolid
} from '@heroicons/react/24/solid';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useChat } from '../../hooks/use-chat';
import {
  ChatSessionCreateRequest,
  MESSAGE_ROLE,
  OPENAI_MODEL,
  OpenAIMessageRequest,
} from '../../types/chat';

/**
 * Goover.ai 스타일 채팅 컴포넌트
 */
const Chat2: React.FC = () => {
  // 채팅 컨텍스트 사용
  const {
    sessions,
    isLoadingSessions,
    sessionsError,
    createSession,
    updateSession,
    deleteSession,
    sendMessage,
    refetchSessions,
    useChatMessages,
    isCreatingSession,
    isUpdatingSession,
    isDeletingSession,
    isSendingMessage,
  } = useChat();

  // 로컬 상태 관리
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 현재 선택된 세션 정보
  const currentSession = sessions.find(session => session.id === currentSessionId);

  // 현재 세션의 메시지 조회
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages
  } = useChatMessages(currentSessionId || undefined);

  // 기본 설정값
  const [settings] = useState({
    model: OPENAI_MODEL.GPT_4_TURBO,
    temperature: 0.7,
    maxTokens: 4000,
  });

  // 참조 객체들
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 세션 목록 불러오기
  useEffect(() => {
    refetchSessions();
  }, [refetchSessions]);

  // 첫 번째 세션을 자동으로 선택 (세션이 있을 때)
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0 && sessions[0]) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  // 메시지 자동 스크롤
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 입력창 높이 자동 조절
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [messageInput]);

  // 새 채팅 세션 생성
  const handleCreateNewSession = async () => {
    try {
      const sessionData: ChatSessionCreateRequest = {
        title: '새 채팅',
        model: settings.model,
        temperature: settings.temperature.toString(),
        max_tokens: settings.maxTokens,
        tags: [],
      };

      const newSession = await createSession(sessionData);
      setCurrentSessionId(newSession.id);
      setMessageInput('');
      toast.success('새 채팅이 시작되었습니다.');
    } catch (error) {
      console.error('새 세션 생성 실패:', error);
      toast.error('새 채팅을 시작할 수 없습니다.');
    }
  };

  // 세션 선택 처리
  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  // 메시지 전송 처리
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentSessionId || isSendingMessage) {
      return;
    }

    const message = messageInput.trim();
    setMessageInput('');

    try {
      const request: OpenAIMessageRequest = {
        session_id: currentSessionId,
        message: message,
        stream: false,
      };

      await sendMessage(request);
      // 메시지 전송 후 세션 목록과 메시지 목록 새로고침
      refetchSessions();
      refetchMessages();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setMessageInput(message);
      toast.error('메시지를 전송할 수 없습니다.');
    }
  };

  // 세션 제목 편집 시작
  const handleEditSession = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  // 세션 제목 저장
  const handleSaveSessionTitle = async () => {
    if (!editingSessionId || !editingTitle.trim()) return;

    try {
      await updateSession({
        sessionId: editingSessionId,
        sessionData: { title: editingTitle.trim() }
      });
      setEditingSessionId(null);
      setEditingTitle('');
      toast.success('채팅 제목이 수정되었습니다.');
    } catch (error) {
      console.error('세션 제목 업데이트 실패:', error);
      toast.error('세션 제목을 업데이트할 수 없습니다.');
    }
  };

  // 세션 제목 편집 취소
  const handleCancelEditSession = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // 세션 삭제 처리
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);

      // 삭제된 세션이 현재 선택된 세션이면 다른 세션으로 변경
      if (currentSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setCurrentSessionId(remainingSessions.length > 0 && remainingSessions[0] ? remainingSessions[0].id : null);
      }

      toast.success('채팅이 삭제되었습니다.');
    } catch (error) {
      console.error('세션 삭제 실패:', error);
      toast.error('채팅을 삭제할 수 없습니다.');
    }
  };

  // 키 입력 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 시간 형식 변환 함수
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  // 제안 프롬프트 목록
  const suggestions = [
    {
      title: "💡 브레인스토밍",
      subtitle: "창의적인 아이디어와 솔루션",
      prompt: "다음에 대한 창의적인 아이디어를 브레인스토밍해주세요"
    },
    {
      title: "✍️ 글쓰기",
      subtitle: "콘텐츠 작성 및 카피라이팅",
      prompt: "다음에 대한 전문적인 콘텐츠를 작성해주세요"
    },
    {
      title: "🔍 분석",
      subtitle: "데이터 및 연구 인사이트",
      prompt: "다음을 분석하고 이해를 도와주세요"
    },
    {
      title: "🎯 계획",
      subtitle: "전략 수립 및 실행",
      prompt: "다음에 대한 상세한 계획을 세워주세요"
    }
  ];

  // 로딩 상태 화면
  if (isLoadingSessions) {
    return (
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center w-full">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">채팅을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 오류 상태 화면
  if (sessionsError) {
    return (
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XMarkIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              채팅을 불러올 수 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {sessionsError instanceof Error ? sessionsError.message : '알 수 없는 오류가 발생했습니다.'}
            </p>
            <button
              onClick={() => refetchSessions()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* 사이드바 */}
      <div className={classNames(
        'transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
        isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
      )}>
        <div className="flex flex-col h-full">
          {/* 사이드바 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Goover AI
              </h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 lg:hidden"
              title="사이드바 닫기"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 새 채팅 버튼 */}
          <div className="p-4">
            <button
              onClick={handleCreateNewSession}
              disabled={isCreatingSession}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingSession ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <PlusIcon className="w-4 h-4 mr-2" />
              )}
              새 채팅
            </button>
          </div>

          {/* 채팅 목록 */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={classNames(
                    'group relative flex items-center p-3 rounded-lg cursor-pointer transition-colors',
                    currentSessionId === session.id
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <ChatIconSolid className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />

                  {editingSessionId === session.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={handleSaveSessionTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveSessionTitle();
                        } else if (e.key === 'Escape') {
                          handleCancelEditSession();
                        }
                      }}
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none"
                      autoFocus
                      placeholder="채팅 제목 편집"
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(session.last_activity_at || session.created_at)}
                      </p>
                    </div>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 ml-2 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSession(session.id, session.title);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="제목 편집"
                      disabled={isUpdatingSession}
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="채팅 삭제"
                      disabled={isDeletingSession}
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {sessions.length === 0 && !isLoadingSessions && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  아직 대화가 없습니다
                </p>
                <button
                  onClick={handleCreateNewSession}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  첫 번째 채팅 만들기
                </button>
              </div>
            )}
          </div>

          {/* 사이드바 하단 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Cog6ToothIcon className="w-4 h-4 mr-3" />
              설정
            </button>
          </div>
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={classNames(
                'p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg transition-colors',
                !isSidebarOpen ? 'block lg:hidden' : 'hidden'
              )}
              title="사이드바 열기"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {currentSession?.title || 'Goover AI'}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {currentSession && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>온라인</span>
              </div>
            )}
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {!currentSession ? (
              /* 시작 화면 */
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8">
                <div className="text-center mb-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <SparklesIcon className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    오늘 무엇을 도와드릴까요?
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                    최신 언어 모델로 구동되는 AI 어시스턴트입니다.
                    무엇이든 물어보시거나 아래 제안 중 하나를 선택해보세요.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (!currentSession) {
                          handleCreateNewSession().then(() => {
                            setMessageInput(suggestion.prompt + " ");
                          });
                        } else {
                          setMessageInput(suggestion.prompt + " ");
                        }
                      }}
                      className="group p-6 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{suggestion.title.split(' ')[0]}</span>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                            {suggestion.title.substring(2)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* 메시지 목록 */
              <div className="px-4 py-8">
                {isLoadingMessages ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">
                      메시지를 불러오는 중...
                    </p>
                  </div>
                ) : messagesError ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <XMarkIcon className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      메시지를 불러올 수 없습니다.
                    </p>
                    <button
                      onClick={() => refetchMessages()}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      아래 메시지를 입력하여 대화를 시작하세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message, index) => (
                      <div
                        key={message.id || index}
                        className={classNames(
                          'flex gap-4',
                          message.role === MESSAGE_ROLE.USER ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        {/* 아바타 */}
                        <div className={classNames(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0',
                          message.role === MESSAGE_ROLE.USER
                            ? 'bg-gray-600 dark:bg-gray-700'
                            : 'bg-gradient-to-br from-purple-600 to-blue-500'
                        )}>
                          {message.role === MESSAGE_ROLE.USER ? '나' : 'AI'}
                        </div>

                        {/* 메시지 내용 */}
                        <div className={classNames(
                          'flex-1 max-w-xl',
                          message.role === MESSAGE_ROLE.USER ? 'text-right' : 'text-left'
                        )}>
                          <div className={classNames(
                            'inline-block px-4 py-3 rounded-2xl',
                            message.role === MESSAGE_ROLE.USER
                              ? 'bg-gray-900 dark:bg-gray-700 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          )}>
                            <div className="whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2 px-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(message.created_at || new Date().toISOString())}
                            </span>

                            {message.role === MESSAGE_ROLE.ASSISTANT && (
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                {message.tokens_used && (
                                  <span>{message.tokens_used} 토큰</span>
                                )}
                                {message.response_time && (
                                  <span>{message.response_time}ms</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isSendingMessage && (
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-xs font-medium text-white">
                          AI
                        </div>
                        <div className="flex-1 max-w-xl">
                          <div className="inline-block px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="flex items-end space-x-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  disabled={isSendingMessage}
                  title="파일 첨부"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={currentSession ? "여기에 메시지를 입력하세요..." : "새 채팅을 만들어 메시지를 시작하세요..."}
                    className="w-full min-h-[52px] max-h-[120px] px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                    disabled={isSendingMessage || !currentSession}
                    rows={1}
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isSendingMessage || !currentSession}
                    className={classNames(
                      'absolute right-2 bottom-2 p-2 rounded-lg transition-all',
                      messageInput.trim() && !isSendingMessage && currentSession
                        ? 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    )}
                    title="메시지 전송"
                  >
                    {isSendingMessage ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <PaperAirplaneIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  {currentSession && (
                    <>
                      <span>모델: {currentSession.model}</span>
                      <span>•</span>
                      <span>온도: {currentSession.temperature}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span>Enter키로 전송</span>
                  {messageInput.length > 0 && (
                    <span className={messageInput.length > 3000 ? 'text-red-500' : ''}>
                      {messageInput.length}/4000
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 설정 모달 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">설정</h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                  title="설정 닫기"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Cog6ToothIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  설정 패널 준비 중
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.doc,.docx"
        onChange={() => toast('파일 업로드 기능 준비 중')}
        className="hidden"
        title="파일 업로드"
      />
    </div>
  );
};

export default Chat2;
