import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ChatContextType, ChatSession, ChatSessionList } from '../types/chat';

// 상태 타입 정의
interface ChatState {
  sessions: ChatSessionList[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
}

// 액션 타입 정의
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSIONS'; payload: ChatSessionList[] }
  | { type: 'SET_CURRENT_SESSION'; payload: ChatSession | null }
  | { type: 'CLEAR_CURRENT_SESSION' }
  | { type: 'CLEAR_ERROR' };

// 초기 상태
const initialState: ChatState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
};

// 리듀서 함수
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload, isLoading: false };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload, isLoading: false };
    case 'CLEAR_CURRENT_SESSION':
      return { ...state, currentSession: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context 생성
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider 컴포넌트
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // 액션 함수들은 hooks에서 구현되므로 여기서는 빈 함수로 정의
  const contextValue: ChatContextType = {
    ...state,
    fetchSessions: async () => {},
    createSession: async () => 0,
    selectSession: async () => {},
    sendMessage: async () => {},
    deleteSession: async () => {},
    clearCurrentSession: () => dispatch({ type: 'CLEAR_CURRENT_SESSION' }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
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
