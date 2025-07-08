export interface ChatMessage {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface ChatSession {
  id: number;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  messages: ChatMessage[];
}

export interface ChatSessionList {
  id: number;
  title: string;
  is_active: boolean;
  created_at: string;
  last_message?: string;
}

export interface ChatMessageCreate {
  content: string;
  role?: 'user' | 'assistant';
}

export interface ChatSessionCreate {
  title?: string;
}

export interface ChatContextType {
  sessions: ChatSessionList[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  
  // 액션들
  fetchSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<number>;
  selectSession: (sessionId: number) => Promise<void>;
  sendMessage: (sessionId: number, content: string) => Promise<void>;
  deleteSession: (sessionId: number) => Promise<void>;
  clearCurrentSession: () => void;
  clearError: () => void;
}