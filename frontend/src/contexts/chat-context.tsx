import React, { createContext, ReactNode, useCallback, useContext, useReducer } from 'react';
import { toast } from 'react-hot-toast';
import { chatService } from '../services/chat-service';
import {
  ChatMessageListResponse,
  ChatMessageResponse,
  ChatMessageSearchRequest,
  ChatSessionCreateRequest,
  ChatSessionListResponse,
  ChatSessionResponse,
  ChatSessionSearchRequest,
  ChatSessionUpdateRequest,
  ChatTemplateListResponse,
  ChatTemplateResponse,
  ChatTemplateSearchRequest,
  OpenAIMessageRequest,
  OpenAIResponse
} from '../types/chat';

// 상태 타입 정의
interface ChatState {
  // 세션 관련
  sessions: ChatSessionResponse[];
  currentSession: ChatSessionResponse | null;
  currentSessionId: string | null;

  // 메시지 관련
  messages: ChatMessageResponse[];

  // 템플릿 관련
  templates: ChatTemplateResponse[];

  // 로딩 상태
  isLoading: boolean;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  isLoadingTemplates: boolean;

  // 액션 로딩 상태
  isCreatingSession: boolean;
  isUpdatingSession: boolean;
  isDeletingSession: boolean;
  isSendingMessage: boolean;

  // 에러 상태
  error: string | null;
  sessionsError: string | null;
  messagesError: string | null;
  templatesError: string | null;
}

// 액션 타입 정의
type ChatAction =
  // 로딩 상태 액션
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSIONS_LOADING'; payload: boolean }
  | { type: 'SET_MESSAGES_LOADING'; payload: boolean }
  | { type: 'SET_TEMPLATES_LOADING'; payload: boolean }
  | { type: 'SET_CREATING_SESSION'; payload: boolean }
  | { type: 'SET_UPDATING_SESSION'; payload: boolean }
  | { type: 'SET_DELETING_SESSION'; payload: boolean }
  | { type: 'SET_SENDING_MESSAGE'; payload: boolean }

  // 에러 상태 액션
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSIONS_ERROR'; payload: string | null }
  | { type: 'SET_MESSAGES_ERROR'; payload: string | null }
  | { type: 'SET_TEMPLATES_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }

  // 데이터 액션
  | { type: 'SET_SESSIONS'; payload: ChatSessionResponse[] }
  | { type: 'SET_CURRENT_SESSION'; payload: ChatSessionResponse | null }
  | { type: 'SET_CURRENT_SESSION_ID'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: ChatMessageResponse[] }
  | { type: 'SET_TEMPLATES'; payload: ChatTemplateResponse[] }
  | { type: 'ADD_SESSION'; payload: ChatSessionResponse }
  | { type: 'UPDATE_SESSION'; payload: { id: string; data: Partial<ChatSessionResponse> } }
  | { type: 'REMOVE_SESSION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: ChatMessageResponse }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; data: Partial<ChatMessageResponse> } }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'CLEAR_CURRENT_SESSION' };

// 초기 상태
const initialState: ChatState = {
  // 세션 관련
  sessions: [],
  currentSession: null,
  currentSessionId: null,

  // 메시지 관련
  messages: [],

  // 템플릿 관련
  templates: [],

  // 로딩 상태
  isLoading: false,
  isLoadingSessions: false,
  isLoadingMessages: false,
  isLoadingTemplates: false,

  // 액션 로딩 상태
  isCreatingSession: false,
  isUpdatingSession: false,
  isDeletingSession: false,
  isSendingMessage: false,

  // 에러 상태
  error: null,
  sessionsError: null,
  messagesError: null,
  templatesError: null,
};

// 리듀서 함수
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    // 로딩 상태 액션
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SESSIONS_LOADING':
      return { ...state, isLoadingSessions: action.payload };
    case 'SET_MESSAGES_LOADING':
      return { ...state, isLoadingMessages: action.payload };
    case 'SET_TEMPLATES_LOADING':
      return { ...state, isLoadingTemplates: action.payload };
    case 'SET_CREATING_SESSION':
      return { ...state, isCreatingSession: action.payload };
    case 'SET_UPDATING_SESSION':
      return { ...state, isUpdatingSession: action.payload };
    case 'SET_DELETING_SESSION':
      return { ...state, isDeletingSession: action.payload };
    case 'SET_SENDING_MESSAGE':
      return { ...state, isSendingMessage: action.payload };

    // 에러 상태 액션
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SESSIONS_ERROR':
      return { ...state, sessionsError: action.payload };
    case 'SET_MESSAGES_ERROR':
      return { ...state, messagesError: action.payload };
    case 'SET_TEMPLATES_ERROR':
      return { ...state, templatesError: action.payload };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        sessionsError: null,
        messagesError: null,
        templatesError: null
      };

    // 데이터 액션
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_CURRENT_SESSION_ID':
      return { ...state, currentSessionId: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id
            ? { ...session, ...action.payload.data }
            : session
        ),
        currentSession: state.currentSession?.id === action.payload.id
          ? { ...state.currentSession, ...action.payload.data }
          : state.currentSession
      };
    case 'REMOVE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(session => session.id !== action.payload),
        currentSession: state.currentSession?.id === action.payload ? null : state.currentSession,
        currentSessionId: state.currentSessionId === action.payload ? null : state.currentSessionId
      };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.id
            ? { ...message, ...action.payload.data }
            : message
        )
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(message => message.id !== action.payload)
      };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'CLEAR_CURRENT_SESSION':
      return { ...state, currentSession: null, currentSessionId: null, messages: [] };

    default:
      return state;
  }
};

// Context 타입 정의
interface ChatContextType {
  // 상태
  sessions: ChatSessionResponse[];
  currentSession: ChatSessionResponse | null;
  currentSessionId: string | null;
  messages: ChatMessageResponse[];
  templates: ChatTemplateResponse[];

  // 로딩 상태
  isLoading: boolean;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  isLoadingTemplates: boolean;
  isCreatingSession: boolean;
  isUpdatingSession: boolean;
  isDeletingSession: boolean;
  isSendingMessage: boolean;

  // 에러 상태
  error: string | null;
  sessionsError: string | null;
  messagesError: string | null;
  templatesError: string | null;

  // 액션 함수
  fetchSessions: (params?: ChatSessionSearchRequest) => Promise<void>;
  fetchMessages: (sessionId: string, params?: ChatMessageSearchRequest) => Promise<void>;
  fetchTemplates: (params?: ChatTemplateSearchRequest) => Promise<void>;
  createSession: (data: ChatSessionCreateRequest) => Promise<ChatSessionResponse>;
  updateSession: (id: string, data: ChatSessionUpdateRequest) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  sendMessage: (request: OpenAIMessageRequest) => Promise<void>;
  clearCurrentSession: () => void;
  clearError: () => void;
  refetchSessions: () => Promise<void>;
  refetchMessages: () => Promise<void>;
  refetchTemplates: () => Promise<void>;
}

// Context 생성
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider 컴포넌트
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // 세션 목록 조회
  const fetchSessions = useCallback(async (params?: ChatSessionSearchRequest) => {
    try {
      dispatch({ type: 'SET_SESSIONS_LOADING', payload: true });
      dispatch({ type: 'SET_SESSIONS_ERROR', payload: null });

      const response: ChatSessionListResponse = await chatService.listChatSessions(params);
      dispatch({ type: 'SET_SESSIONS', payload: response.sessions });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '세션 목록을 불러오는데 실패했습니다.';
      dispatch({ type: 'SET_SESSIONS_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_SESSIONS_LOADING', payload: false });
    }
  }, []);

  // 메시지 목록 조회
  const fetchMessages = useCallback(async (sessionId: string, params?: ChatMessageSearchRequest) => {
    try {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: true });
      dispatch({ type: 'SET_MESSAGES_ERROR', payload: null });

      const response: ChatMessageListResponse = await chatService.listChatMessages(sessionId, params);
      dispatch({ type: 'SET_MESSAGES', payload: response.messages });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메시지를 불러오는데 실패했습니다.';
      dispatch({ type: 'SET_MESSAGES_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: false });
    }
  }, []);

  // 템플릿 목록 조회
  const fetchTemplates = useCallback(async (params?: ChatTemplateSearchRequest) => {
    try {
      dispatch({ type: 'SET_TEMPLATES_LOADING', payload: true });
      dispatch({ type: 'SET_TEMPLATES_ERROR', payload: null });

      const response: ChatTemplateListResponse = await chatService.listChatTemplates(params);
      dispatch({ type: 'SET_TEMPLATES', payload: response.templates });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '템플릿을 불러오는데 실패했습니다.';
      dispatch({ type: 'SET_TEMPLATES_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_TEMPLATES_LOADING', payload: false });
    }
  }, []);

  // 세션 생성
  const createSession = useCallback(async (data: ChatSessionCreateRequest): Promise<ChatSessionResponse> => {
    try {
      dispatch({ type: 'SET_CREATING_SESSION', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const session: ChatSessionResponse = await chatService.createChatSession(data);
      dispatch({ type: 'ADD_SESSION', payload: session });

      toast.success('새 채팅이 생성되었습니다.');
      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '세션 생성에 실패했습니다.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_CREATING_SESSION', payload: false });
    }
  }, []);

  // 세션 업데이트
  const updateSession = useCallback(async (id: string, data: ChatSessionUpdateRequest) => {
    try {
      dispatch({ type: 'SET_UPDATING_SESSION', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const updatedSession: ChatSessionResponse = await chatService.updateChatSession(id, data);
      dispatch({ type: 'UPDATE_SESSION', payload: { id, data: updatedSession } });

      toast.success('세션이 업데이트되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '세션 업데이트에 실패했습니다.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_UPDATING_SESSION', payload: false });
    }
  }, []);

  // 세션 삭제
  const deleteSession = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_DELETING_SESSION', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await chatService.deleteChatSession(id);
      dispatch({ type: 'REMOVE_SESSION', payload: id });

      toast.success('세션이 삭제되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '세션 삭제에 실패했습니다.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_DELETING_SESSION', payload: false });
    }
  }, []);

  // 세션 선택
  const selectSession = useCallback(async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // 세션 정보 조회
      const session: ChatSessionResponse = await chatService.getChatSession(sessionId);
      dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
      dispatch({ type: 'SET_CURRENT_SESSION_ID', payload: sessionId });

      // 메시지 목록 조회
      await fetchMessages(sessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '세션 선택에 실패했습니다.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [fetchMessages]);

  // 메시지 전송
  const sendMessage = useCallback(async (request: OpenAIMessageRequest) => {
    try {
      dispatch({ type: 'SET_SENDING_MESSAGE', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response: OpenAIResponse = await chatService.sendMessageToAI(request);

      // 사용자 메시지 생성
      const userMessage: ChatMessageResponse = {
        id: `user-${Date.now()}`,
        content: request.message,
        role: 'user',
        input_mode: 'text',
        status: 'sent',
        session_id: request.session_id,
        user_id: 'current-user', // 실제 사용자 ID로 대체
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // AI 응답 메시지 생성
      const assistantMessage: ChatMessageResponse = {
        id: response.message_id,
        content: response.content,
        role: 'assistant',
        input_mode: 'text',
        status: 'sent',
        session_id: request.session_id,
        user_id: 'current-user', // 실제 사용자 ID로 대체
        model_used: response.model,
        tokens_used: response.tokens_used,
        cost: response.cost,
        response_time: response.response_time,
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 메시지 추가
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

      // 세션 정보 업데이트
      if (state.currentSession) {
        const updatedSession: Partial<ChatSessionResponse> = {
          message_count: (state.currentSession.message_count || 0) + 2,
          total_tokens: (state.currentSession.total_tokens || 0) + response.tokens_used,
          total_cost: (parseFloat(state.currentSession.total_cost || '0') + parseFloat(response.cost)).toFixed(6),
          last_activity_at: new Date().toISOString()
        };
        dispatch({ type: 'SET_CURRENT_SESSION', payload: { ...state.currentSession, ...updatedSession } });
        dispatch({ type: 'UPDATE_SESSION', payload: { id: state.currentSession.id, data: updatedSession } });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메시지 전송에 실패했습니다.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_SENDING_MESSAGE', payload: false });
    }
  }, [state.currentSession]);

  // 현재 세션 클리어
  const clearCurrentSession = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_SESSION' });
  }, []);

  // 에러 클리어
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // 세션 목록 새로고침
  const refetchSessions = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  // 메시지 목록 새로고침
  const refetchMessages = useCallback(async () => {
    if (state.currentSessionId) {
      await fetchMessages(state.currentSessionId);
    }
  }, [fetchMessages, state.currentSessionId]);

  // 템플릿 목록 새로고침
  const refetchTemplates = useCallback(async () => {
    await fetchTemplates();
  }, [fetchTemplates]);

  // Context 값 생성
  const contextValue: ChatContextType = {
    // 상태
    sessions: state.sessions,
    currentSession: state.currentSession,
    currentSessionId: state.currentSessionId,
    messages: state.messages,
    templates: state.templates,

    // 로딩 상태
    isLoading: state.isLoading,
    isLoadingSessions: state.isLoadingSessions,
    isLoadingMessages: state.isLoadingMessages,
    isLoadingTemplates: state.isLoadingTemplates,
    isCreatingSession: state.isCreatingSession,
    isUpdatingSession: state.isUpdatingSession,
    isDeletingSession: state.isDeletingSession,
    isSendingMessage: state.isSendingMessage,

    // 에러 상태
    error: state.error,
    sessionsError: state.sessionsError,
    messagesError: state.messagesError,
    templatesError: state.templatesError,

    // 액션 함수
    fetchSessions,
    fetchMessages,
    fetchTemplates,
    createSession,
    updateSession,
    deleteSession,
    selectSession,
    sendMessage,
    clearCurrentSession,
    clearError,
    refetchSessions,
    refetchMessages,
    refetchTemplates,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Context 사용을 위한 커스텀 훅
export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext는 ChatProvider 내에서 사용되어야 합니다.');
  }
  return context;
};

// 개별 기능별 훅들
export const useChatSessions = () => {
  const context = useChatContext();
  return {
    sessions: context.sessions,
    isLoadingSessions: context.isLoadingSessions,
    sessionsError: context.sessionsError,
    fetchSessions: context.fetchSessions,
    refetchSessions: context.refetchSessions,
    createSession: context.createSession,
    updateSession: context.updateSession,
    deleteSession: context.deleteSession,
    isCreatingSession: context.isCreatingSession,
    isUpdatingSession: context.isUpdatingSession,
    isDeletingSession: context.isDeletingSession,
  };
};

export const useChatMessages = () => {
  const context = useChatContext();
  return {
    messages: context.messages,
    isLoadingMessages: context.isLoadingMessages,
    messagesError: context.messagesError,
    fetchMessages: context.fetchMessages,
    refetchMessages: context.refetchMessages,
    sendMessage: context.sendMessage,
    isSendingMessage: context.isSendingMessage,
  };
};

export const useChatTemplates = () => {
  const context = useChatContext();
  return {
    templates: context.templates,
    isLoadingTemplates: context.isLoadingTemplates,
    templatesError: context.templatesError,
    fetchTemplates: context.fetchTemplates,
    refetchTemplates: context.refetchTemplates,
  };
};

export const useChatSession = () => {
  const context = useChatContext();
  return {
    currentSession: context.currentSession,
    currentSessionId: context.currentSessionId,
    selectSession: context.selectSession,
    clearCurrentSession: context.clearCurrentSession,
    isLoading: context.isLoading,
  };
};

export default ChatContext;
