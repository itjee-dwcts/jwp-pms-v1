// frontend/src/types/chat.ts
/**
 * 채팅 관련 타입 정의
 *
 * OpenAI API와 연동하는 채팅 기능을 위한 모든 타입들
 */

import { BaseEntity } from './common';

// ============================================================================
// 열거형 상수들
// ============================================================================

/**
 * 메시지 역할
 */
export const MESSAGE_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export type MessageRole = typeof MESSAGE_ROLE[keyof typeof MESSAGE_ROLE];

/**
 * 채팅 세션 상태
 */
export const SESSION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

/**
 * 메시지 상태
 */
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  ERROR: 'error',
} as const;

export type MessageStatus = typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS];

/**
 * 채팅 테마
 */
export const CHAT_THEME = {
  DEFAULT: 'default',
  COMPACT: 'compact',
  BUBBLE: 'bubble',
  MINIMAL: 'minimal',
} as const;

export type ChatTheme = typeof CHAT_THEME[keyof typeof CHAT_THEME];

/**
 * OpenAI 모델
 */
export const OPENAI_MODEL = {
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  GPT_4: 'gpt-4',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4_VISION: 'gpt-4-vision-preview',
} as const;

export type OpenAIModel = typeof OPENAI_MODEL[keyof typeof OPENAI_MODEL];

/**
 * 입력 방식
 */
export const INPUT_MODE = {
  TEXT: 'text',
  VOICE: 'voice',
  FILE: 'file',
} as const;

export type InputMode = typeof INPUT_MODE[keyof typeof INPUT_MODE];

// ============================================================================
// 기본 인터페이스들
// ============================================================================

/**
 * 채팅 세션 기본 인터페이스
 */
export interface ChatSessionBase {
  title: string;
  description?: string;
  model: OpenAIModel;
  temperature: string;
  max_tokens: number;
  system_prompt?: string;
  tags?: string[];
}

/**
 * 채팅 메시지 기본 인터페이스
 */
export interface ChatMessageBase {
  content: string;
  role: MessageRole;
  input_mode: InputMode;
  attachments?: any[];
  parent_message_id?: string;
}

/**
 * 채팅 템플릿 기본 인터페이스
 */
export interface ChatTemplateBase {
  name: string;
  description?: string;
  content: string;
  category?: string;
  tags?: string[];
  is_public: boolean;
}

// ============================================================================
// 요청 인터페이스들
// ============================================================================

/**
 * 채팅 세션 생성 요청
 */
export interface ChatSessionCreateRequest extends ChatSessionBase {}

/**
 * 채팅 세션 수정 요청
 */
export interface ChatSessionUpdateRequest extends Partial<ChatSessionBase> {
  is_pinned?: boolean;
  is_favorite?: boolean;
}

/**
 * 채팅 메시지 생성 요청
 */
export interface ChatMessageCreateRequest extends ChatMessageBase {
  session_id: string;
}

/**
 * 채팅 메시지 수정 요청
 */
export interface ChatMessageUpdateRequest {
  content?: string;
  is_deleted?: boolean;
}

/**
 * 채팅 템플릿 생성 요청
 */
export interface ChatTemplateCreateRequest extends ChatTemplateBase {}

/**
 * 채팅 템플릿 수정 요청
 */
export interface ChatTemplateUpdateRequest extends Partial<ChatTemplateBase> {}

/**
 * OpenAI 메시지 요청
 */
export interface OpenAIMessageRequest {
  session_id: string;
  message: string;
  stream?: boolean;
}

// ============================================================================
// 응답 인터페이스들
// ============================================================================

/**
 * 채팅 세션 응답
 */
export interface ChatSessionResponse extends BaseEntity, ChatSessionBase {
  status: SessionStatus;
  user_id: string;
  is_pinned: boolean;
  is_favorite: boolean;
  message_count: number;
  total_tokens: number;
  total_cost: string;
  last_activity_at: string;
}

/**
 * 채팅 메시지 응답
 */
export interface ChatMessageResponse extends BaseEntity, ChatMessageBase {
  status: MessageStatus;
  session_id: string;
  user_id: string;
  model_used?: OpenAIModel;
  tokens_used?: number;
  cost?: string;
  response_time?: number;
  is_edited: boolean;
  is_deleted: boolean;
}

/**
 * 채팅 템플릿 응답
 */
export interface ChatTemplateResponse extends BaseEntity, ChatTemplateBase {
  user_id: string;
  is_featured: boolean;
  usage_count: number;
  likes_count: number;
}

/**
 * OpenAI 응답
 */
export interface OpenAIResponse {
  message_id: string;
  content: string;
  model: OpenAIModel;
  tokens_used: number;
  cost: string;
  response_time: number;
}

/**
 * 채팅 사용량 통계 응답
 */
export interface ChatUsageStatsResponse {
  date: string;
  period_type: string;
  sessions_count: number;
  messages_count: number;
  tokens_used: number;
  total_cost: string;
  model_usage: Record<string, any>;
}

// ============================================================================
// 목록 응답 인터페이스들
// ============================================================================

/**
 * 채팅 세션 목록 응답
 */
export interface ChatSessionListResponse {
  sessions: ChatSessionResponse[];
  total_count: number;
  page_no: number;
  page_size: number;
}

/**
 * 채팅 메시지 목록 응답
 */
export interface ChatMessageListResponse {
  messages: ChatMessageResponse[];
  total_count: number;
  page_no: number;
  page_size: number;
}

/**
 * 채팅 템플릿 목록 응답
 */
export interface ChatTemplateListResponse {
  templates: ChatTemplateResponse[];
  total_count: number;
  page_no: number;
  page_size: number;
}

// ============================================================================
// 검색 및 필터 인터페이스들
// ============================================================================

/**
 * 채팅 세션 검색 요청
 */
export interface ChatSessionSearchRequest {
  search_text?: string;
  status?: SessionStatus;
  model?: OpenAIModel;
  tags?: string[];
  is_pinned?: boolean;
  is_favorite?: boolean;
  start_date?: string;
  end_date?: string;
  page_no?: number;
  page_size?: number;
}

/**
 * 채팅 메시지 검색 요청
 */
export interface ChatMessageSearchRequest {
  session_id?: string;
  search_text?: string;
  role?: MessageRole;
  status?: MessageStatus;
  input_mode?: InputMode;
  start_date?: string;
  end_date?: string;
  page_no?: number;
  page_size?: number;
}

/**
 * 채팅 템플릿 검색 요청
 */
export interface ChatTemplateSearchRequest {
  search_text?: string;
  category?: string;
  tags?: string[];
  is_public?: boolean;
  is_featured?: boolean;
  page_no?: number;
  page_size?: number;
}

// ============================================================================
// UI 관련 인터페이스들
// ============================================================================

/**
 * 채팅 설정
 */
export interface ChatSettings {
  theme: ChatTheme;
  default_model: OpenAIModel;
  default_temperature: string;
  default_max_tokens: number;
  auto_save: boolean;
  sound_enabled: boolean;
  typing_indicator: boolean;
  message_timestamp: boolean;
}

/**
 * 채팅 UI 상태
 */
export interface ChatUIState {
  is_sidebar_open: boolean;
  is_settings_open: boolean;
  is_template_modal_open: boolean;
  selected_session_id?: string;
  is_loading: boolean;
  is_typing: boolean;
  error_message?: string;
}

/**
 * 메시지 스타일
 */
export interface MessageStyle {
  bg_color: string;
  text_color: string;
  alignment: string;
  border_radius: string;
}

// ============================================================================
// 상태 관리 인터페이스들 (Zustand)
// ============================================================================

/**
 * 채팅 상태 저장소
 */
export interface ChatStore {
  // 상태
  sessions: ChatSessionResponse[];
  current_session?: ChatSessionResponse;
  messages: ChatMessageResponse[];
  templates: ChatTemplateResponse[];
  ui_state: ChatUIState;
  settings: ChatSettings;

  // 세션 관리 액션
  createSession: (data: ChatSessionCreateRequest) => Promise<void>;
  loadSessions: (params?: ChatSessionSearchRequest) => Promise<void>;
  selectSession: (session_id: string) => Promise<void>;
  updateSession: (session_id: string, data: ChatSessionUpdateRequest) => Promise<void>;
  deleteSession: (session_id: string) => Promise<void>;

  // 메시지 관리 액션
  loadMessages: (session_id: string, params?: ChatMessageSearchRequest) => Promise<void>;
  sendMessage: (request: OpenAIMessageRequest) => Promise<void>;
  createMessage: (data: ChatMessageCreateRequest) => Promise<void>;

  // 템플릿 관리 액션
  loadTemplates: (params?: ChatTemplateSearchRequest) => Promise<void>;
  createTemplate: (data: ChatTemplateCreateRequest) => Promise<void>;
  useTemplate: (template_id: string) => void;

  // UI 상태 액션
  setSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setTemplateModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setTyping: (typing: boolean) => void;
  setError: (error?: string) => void;

  // 설정 액션
  updateSettings: (settings: Partial<ChatSettings>) => void;
  resetSettings: () => void;
}

// ============================================================================
// 이벤트 인터페이스들
// ============================================================================

/**
 * 채팅 이벤트
 */
export interface ChatEvent {
  type: 'message_sent' | 'message_received' | 'session_created' | 'session_updated' | 'typing_start' | 'typing_stop';
  session_id: string;
  user_id: string;
  data?: any;
  timestamp: string;
}

/**
 * 파일 첨부 정보
 */
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail_url?: string;
}

/**
 * 음성 메시지 정보
 */
export interface VoiceMessage {
  id: string;
  duration: number;
  url: string;
  transcript?: string;
  language?: string;
}

// ============================================================================
// 유틸리티 타입들
// ============================================================================

/**
 * API 에러 응답
 */
export interface ChatApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  message: string;
  timestamp: string;
}

/**
 * 페이지네이션 정보
 */
export interface PaginationInfo {
  page_no: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * 검색 필터
 */
export interface SearchFilter {
  key: string;
  label: string;
  value: any;
  type: 'text' | 'select' | 'date' | 'boolean';
  options?: Array<{ value: any; label: string }>;
}

/**
 * 채팅 통계
 */
export interface ChatStatistics {
  total_sessions: number;
  active_sessions: number;
  total_messages: number;
  total_tokens_used: number;
  total_cost: string;
  average_response_time: number;
  favorite_model: OpenAIModel;
  daily_usage: Array<{
    date: string;
    messages: number;
    tokens: number;
    cost: string;
  }>;
}

/**
 * 내보내기 옵션
 */
export interface ExportOptions {
  format: 'json' | 'csv' | 'txt' | 'pdf';
  include_system_messages: boolean;
  include_metadata: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}

// ============================================================================
// 컴포넌트 Props 인터페이스들
// ============================================================================

/**
 * 채팅 컨테이너 Props
 */
export interface ChatContainerProps {
  className?: string;
  theme?: ChatTheme;
  onSessionSelect?: (session: ChatSessionResponse) => void;
}

/**
 * 메시지 아이템 Props
 */
export interface MessageItemProps {
  message: ChatMessageResponse;
  show_timestamp?: boolean;
  show_avatar?: boolean;
  onEdit?: (message_id: string, content: string) => void;
  onDelete?: (message_id: string) => void;
  onReply?: (message_id: string) => void;
}

/**
 * 메시지 입력 Props
 */
export interface MessageInputProps {
  session_id?: string;
  placeholder?: string;
  disabled?: boolean;
  max_length?: number;
  onSend: (message: string) => void;
  onFileUpload?: (files: File[]) => void;
  onVoiceRecord?: (audio: Blob) => void;
}

/**
 * 세션 목록 Props
 */
export interface SessionListProps {
  sessions: ChatSessionResponse[];
  selected_session_id?: string;
  onSessionSelect: (session: ChatSessionResponse) => void;
  onSessionCreate: () => void;
  onSessionUpdate: (session: ChatSessionResponse) => void;
  onSessionDelete: (session_id: string) => void;
}

/**
 * 템플릿 모달 Props
 */
export interface TemplateModalProps {
  is_open: boolean;
  templates: ChatTemplateResponse[];
  onClose: () => void;
  onTemplateSelect: (template: ChatTemplateResponse) => void;
  onTemplateCreate: (data: ChatTemplateCreateRequest) => void;
}
