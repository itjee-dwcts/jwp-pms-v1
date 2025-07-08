// ============================================================================
// constants/chat.ts - 채팅 관련 상수 정의
// ============================================================================

// ============================================================================
// 메시지 역할
// ============================================================================
export const MESSAGE_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export type MessageRole = typeof MESSAGE_ROLE[keyof typeof MESSAGE_ROLE];

// ============================================================================
// 세션 상태
// ============================================================================
export const SESSION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

// ============================================================================
// 메시지 상태
// ============================================================================
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  ERROR: 'error',
} as const;

export type MessageStatus = typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS];

// ============================================================================
// 채팅 테마
// ============================================================================
export const CHAT_THEME = {
  DEFAULT: 'default',
  COMPACT: 'compact',
  BUBBLE: 'bubble',
  MINIMAL: 'minimal',
} as const;

export type ChatTheme = typeof CHAT_THEME[keyof typeof CHAT_THEME];

// ============================================================================
// OpenAI 모델
// ============================================================================
export const OPENAI_MODEL = {
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  GPT_4: 'gpt-4',
  GPT_4_TURBO: 'gpt-4-turbo-preview',
  GPT_4_VISION: 'gpt-4-vision-preview',
} as const;

export type OpenAIModel = typeof OPENAI_MODEL[keyof typeof OPENAI_MODEL];

// ============================================================================
// 채팅 입력 모드
// ============================================================================
export const INPUT_MODE = {
  TEXT: 'text',
  VOICE: 'voice',
  FILE: 'file',
} as const;

export type InputMode = typeof INPUT_MODE[keyof typeof INPUT_MODE];

// ============================================================================
// 라벨 매핑
// ============================================================================

export const MESSAGE_ROLE_LABELS: Record<MessageRole, string> = {
  [MESSAGE_ROLE.USER]: '사용자',
  [MESSAGE_ROLE.ASSISTANT]: 'AI 어시스턴트',
  [MESSAGE_ROLE.SYSTEM]: '시스템',
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  [SESSION_STATUS.ACTIVE]: '활성',
  [SESSION_STATUS.INACTIVE]: '비활성',
  [SESSION_STATUS.ARCHIVED]: '보관됨',
};

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  [MESSAGE_STATUS.SENDING]: '전송 중',
  [MESSAGE_STATUS.SENT]: '전송됨',
  [MESSAGE_STATUS.DELIVERED]: '배달됨',
  [MESSAGE_STATUS.ERROR]: '오류',
};

export const CHAT_THEME_LABELS: Record<ChatTheme, string> = {
  [CHAT_THEME.DEFAULT]: '기본',
  [CHAT_THEME.COMPACT]: '컴팩트',
  [CHAT_THEME.BUBBLE]: '버블',
  [CHAT_THEME.MINIMAL]: '미니멀',
};

export const OPENAI_MODEL_LABELS: Record<OpenAIModel, string> = {
  [OPENAI_MODEL.GPT_3_5_TURBO]: 'GPT-3.5 Turbo',
  [OPENAI_MODEL.GPT_4]: 'GPT-4',
  [OPENAI_MODEL.GPT_4_TURBO]: 'GPT-4 Turbo',
  [OPENAI_MODEL.GPT_4_VISION]: 'GPT-4 Vision',
};

export const INPUT_MODE_LABELS: Record<InputMode, string> = {
  [INPUT_MODE.TEXT]: '텍스트',
  [INPUT_MODE.VOICE]: '음성',
  [INPUT_MODE.FILE]: '파일',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const MESSAGE_ROLE_COLORS: Record<MessageRole, string> = {
  [MESSAGE_ROLE.USER]: 'blue',
  [MESSAGE_ROLE.ASSISTANT]: 'green',
  [MESSAGE_ROLE.SYSTEM]: 'gray',
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  [SESSION_STATUS.ACTIVE]: 'green',
  [SESSION_STATUS.INACTIVE]: 'yellow',
  [SESSION_STATUS.ARCHIVED]: 'gray',
};

export const MESSAGE_STATUS_COLORS: Record<MessageStatus, string> = {
  [MESSAGE_STATUS.SENDING]: 'yellow',
  [MESSAGE_STATUS.SENT]: 'green',
  [MESSAGE_STATUS.DELIVERED]: 'blue',
  [MESSAGE_STATUS.ERROR]: 'red',
};

export const CHAT_THEME_COLORS: Record<ChatTheme, string> = {
  [CHAT_THEME.DEFAULT]: 'blue',
  [CHAT_THEME.COMPACT]: 'purple',
  [CHAT_THEME.BUBBLE]: 'pink',
  [CHAT_THEME.MINIMAL]: 'gray',
};

export const OPENAI_MODEL_COLORS: Record<OpenAIModel, string> = {
  [OPENAI_MODEL.GPT_3_5_TURBO]: 'green',
  [OPENAI_MODEL.GPT_4]: 'blue',
  [OPENAI_MODEL.GPT_4_TURBO]: 'purple',
  [OPENAI_MODEL.GPT_4_VISION]: 'orange',
};

export const INPUT_MODE_COLORS: Record<InputMode, string> = {
  [INPUT_MODE.TEXT]: 'blue',
  [INPUT_MODE.VOICE]: 'green',
  [INPUT_MODE.FILE]: 'orange',
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const MESSAGE_ROLE_OPTIONS = Object.entries(MESSAGE_ROLE_LABELS).map(
  ([value, label]) => ({ value: value as MessageRole, label })
);

export const SESSION_STATUS_OPTIONS = Object.entries(SESSION_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as SessionStatus, label })
);

export const MESSAGE_STATUS_OPTIONS = Object.entries(MESSAGE_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as MessageStatus, label })
);

export const CHAT_THEME_OPTIONS = Object.entries(CHAT_THEME_LABELS).map(
  ([value, label]) => ({ value: value as ChatTheme, label })
);

export const OPENAI_MODEL_OPTIONS = Object.entries(OPENAI_MODEL_LABELS).map(
  ([value, label]) => ({ value: value as OpenAIModel, label })
);

export const INPUT_MODE_OPTIONS = Object.entries(INPUT_MODE_LABELS).map(
  ([value, label]) => ({ value: value as InputMode, label })
);

// ============================================================================
// 채팅 제한 및 설정
// ============================================================================

export const CHAT_LIMITS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_TITLE_LENGTH: 255,
  MAX_SESSIONS_PER_USER: 100,
  MAX_MESSAGES_PER_SESSION: 1000,
  MAX_HISTORY_MESSAGES: 50,
  MAX_INPUT_HEIGHT: 120,
  MIN_INPUT_HEIGHT: 52,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_CONCURRENT_REQUESTS: 5,
} as const;

export const CHAT_SETTINGS = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 1000,
  DEFAULT_MODEL: OPENAI_MODEL.GPT_3_5_TURBO,
  DEFAULT_THEME: CHAT_THEME.DEFAULT,
  AUTO_SAVE_INTERVAL: 30000, // 30초
  TYPING_INDICATOR_DELAY: 1000, // 1초
  MESSAGE_RETRY_COUNT: 3,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24시간
} as const;

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidMessageRole = (role: string): role is MessageRole => {
  return Object.values(MESSAGE_ROLE).includes(role as MessageRole);
};

export const isValidSessionStatus = (status: string): status is SessionStatus => {
  return Object.values(SESSION_STATUS).includes(status as SessionStatus);
};

export const isValidMessageStatus = (status: string): status is MessageStatus => {
  return Object.values(MESSAGE_STATUS).includes(status as MessageStatus);
};

export const isValidChatTheme = (theme: string): theme is ChatTheme => {
  return Object.values(CHAT_THEME).includes(theme as ChatTheme);
};

export const isValidOpenAIModel = (model: string): model is OpenAIModel => {
  return Object.values(OPENAI_MODEL).includes(model as OpenAIModel);
};

export const isValidInputMode = (mode: string): mode is InputMode => {
  return Object.values(INPUT_MODE).includes(mode as InputMode);
};

export const isUserMessage = (role: MessageRole): boolean => {
  return role === MESSAGE_ROLE.USER;
};

export const isAssistantMessage = (role: MessageRole): boolean => {
  return role === MESSAGE_ROLE.ASSISTANT;
};

export const isSystemMessage = (role: MessageRole): boolean => {
  return role === MESSAGE_ROLE.SYSTEM;
};

export const isSessionActive = (status: SessionStatus): boolean => {
  return status === SESSION_STATUS.ACTIVE;
};

export const isSessionInactive = (status: SessionStatus): boolean => {
  return status === SESSION_STATUS.INACTIVE;
};

export const isSessionArchived = (status: SessionStatus): boolean => {
  return status === SESSION_STATUS.ARCHIVED;
};

export const isMessageSending = (status: MessageStatus): boolean => {
  return status === MESSAGE_STATUS.SENDING;
};

export const isMessageSent = (status: MessageStatus): boolean => {
  return status === MESSAGE_STATUS.SENT;
};

export const isMessageError = (status: MessageStatus): boolean => {
  return status === MESSAGE_STATUS.ERROR;
};

export const getMessageRoleIcon = (role: MessageRole): string => {
  const iconMap = {
    [MESSAGE_ROLE.USER]: '👤',
    [MESSAGE_ROLE.ASSISTANT]: '🤖',
    [MESSAGE_ROLE.SYSTEM]: '⚙️',
  };

  return iconMap[role];
};

export const getSessionStatusIcon = (status: SessionStatus): string => {
  const iconMap = {
    [SESSION_STATUS.ACTIVE]: '🟢',
    [SESSION_STATUS.INACTIVE]: '🟡',
    [SESSION_STATUS.ARCHIVED]: '📁',
  };

  return iconMap[status];
};

export const getMessageStatusIcon = (status: MessageStatus): string => {
  const iconMap = {
    [MESSAGE_STATUS.SENDING]: '⏳',
    [MESSAGE_STATUS.SENT]: '✅',
    [MESSAGE_STATUS.DELIVERED]: '📤',
    [MESSAGE_STATUS.ERROR]: '❌',
  };

  return iconMap[status];
};

export const getChatThemeIcon = (theme: ChatTheme): string => {
  const iconMap = {
    [CHAT_THEME.DEFAULT]: '💬',
    [CHAT_THEME.COMPACT]: '📱',
    [CHAT_THEME.BUBBLE]: '💭',
    [CHAT_THEME.MINIMAL]: '📝',
  };

  return iconMap[theme];
};

export const getOpenAIModelIcon = (model: OpenAIModel): string => {
  const iconMap = {
    [OPENAI_MODEL.GPT_3_5_TURBO]: '🚀',
    [OPENAI_MODEL.GPT_4]: '🧠',
    [OPENAI_MODEL.GPT_4_TURBO]: '⚡',
    [OPENAI_MODEL.GPT_4_VISION]: '👁️',
  };

  return iconMap[model];
};

export const getInputModeIcon = (mode: InputMode): string => {
  const iconMap = {
    [INPUT_MODE.TEXT]: '⌨️',
    [INPUT_MODE.VOICE]: '🎤',
    [INPUT_MODE.FILE]: '📎',
  };

  return iconMap[mode];
};

export const getMessageRolePriority = (role: MessageRole): number => {
  const priorityMap = {
    [MESSAGE_ROLE.SYSTEM]: 1,
    [MESSAGE_ROLE.ASSISTANT]: 2,
    [MESSAGE_ROLE.USER]: 3,
  };

  return priorityMap[role];
};

export const getSessionStatusPriority = (status: SessionStatus): number => {
  const priorityMap = {
    [SESSION_STATUS.ACTIVE]: 1,
    [SESSION_STATUS.INACTIVE]: 2,
    [SESSION_STATUS.ARCHIVED]: 3,
  };

  return priorityMap[status];
};

export const getOpenAIModelPriority = (model: OpenAIModel): number => {
  const priorityMap = {
    [OPENAI_MODEL.GPT_4_TURBO]: 1,
    [OPENAI_MODEL.GPT_4]: 2,
    [OPENAI_MODEL.GPT_4_VISION]: 3,
    [OPENAI_MODEL.GPT_3_5_TURBO]: 4,
  };

  return priorityMap[model];
};

// 모델별 기본 설정 가져오기
export const getModelDefaultSettings = (model: OpenAIModel) => {
  const settingsMap = {
    [OPENAI_MODEL.GPT_3_5_TURBO]: {
      maxTokens: 1000,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
    [OPENAI_MODEL.GPT_4]: {
      maxTokens: 1500,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
    [OPENAI_MODEL.GPT_4_TURBO]: {
      maxTokens: 2000,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
    [OPENAI_MODEL.GPT_4_VISION]: {
      maxTokens: 1000,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
  };

  return settingsMap[model];
};

// 메시지 역할별 기본 스타일 가져오기
export const getMessageRoleStyle = (role: MessageRole) => {
  const styleMap = {
    [MESSAGE_ROLE.USER]: {
      bgColor: 'bg-blue-600',
      textColor: 'text-white',
      alignment: 'justify-end',
      borderRadius: 'rounded-l-lg rounded-tr-lg',
    },
    [MESSAGE_ROLE.ASSISTANT]: {
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-900 dark:text-white',
      alignment: 'justify-start',
      borderRadius: 'rounded-r-lg rounded-tl-lg',
    },
    [MESSAGE_ROLE.SYSTEM]: {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      alignment: 'justify-center',
      borderRadius: 'rounded-lg',
    },
  };

  return styleMap[role];
};

// 세션 상태별 액션 가능 여부 확인
export const getSessionActions = (status: SessionStatus) => {
  const actionsMap = {
    [SESSION_STATUS.ACTIVE]: {
      canSendMessage: true,
      canArchive: true,
      canDelete: true,
      canRestore: false,
    },
    [SESSION_STATUS.INACTIVE]: {
      canSendMessage: false,
      canArchive: true,
      canDelete: true,
      canRestore: true,
    },
    [SESSION_STATUS.ARCHIVED]: {
      canSendMessage: false,
      canArchive: false,
      canDelete: true,
      canRestore: true,
    },
  };

  return actionsMap[status];
};

// 입력 모드별 검증 규칙
export const getInputModeValidation = (mode: InputMode) => {
  const validationMap = {
    [INPUT_MODE.TEXT]: {
      maxLength: CHAT_LIMITS.MAX_MESSAGE_LENGTH,
      allowedFormats: ['text/plain'],
      required: true,
    },
    [INPUT_MODE.VOICE]: {
      maxLength: 300, // 5분 (초)
      allowedFormats: ['audio/wav', 'audio/mp3', 'audio/m4a'],
      required: true,
    },
    [INPUT_MODE.FILE]: {
      maxLength: CHAT_LIMITS.MAX_FILE_SIZE,
      allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      required: false,
    },
  };

  return validationMap[mode];
};