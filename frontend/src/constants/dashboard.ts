// ============================================================================
// constants/dashboard.ts - 대시보드 관련 상수 정의
// ============================================================================

// ============================================================================
// 대시보드 상태
// ============================================================================
export const DASHBOARD_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
  OFFLINE: 'offline',
} as const;

export type DashboardStatus = typeof DASHBOARD_STATUS[keyof typeof DASHBOARD_STATUS];

// ============================================================================
// 날짜 범위 타입
// ============================================================================
export const DATE_RANGE_TYPE = {
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom',
} as const;

export type DateRangeType = typeof DATE_RANGE_TYPE[keyof typeof DATE_RANGE_TYPE];

// ============================================================================
// 라벨 매핑
// ============================================================================

export const DASHBOARD_STATUS_LABELS: Record<DashboardStatus, string> = {
  [DASHBOARD_STATUS.LOADING]: '로딩 중',
  [DASHBOARD_STATUS.READY]: '준비됨',
  [DASHBOARD_STATUS.ERROR]: '오류',
  [DASHBOARD_STATUS.OFFLINE]: '오프라인',
};

export const DATE_RANGE_TYPE_LABELS: Record<DateRangeType, string> = {
  [DATE_RANGE_TYPE.WEEK]: '주간',
  [DATE_RANGE_TYPE.MONTH]: '월간',
  [DATE_RANGE_TYPE.QUARTER]: '분기',
  [DATE_RANGE_TYPE.YEAR]: '연간',
  [DATE_RANGE_TYPE.CUSTOM]: '사용자 정의',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const DASHBOARD_STATUS_COLORS: Record<DashboardStatus, string> = {
  [DASHBOARD_STATUS.LOADING]: 'blue',
  [DASHBOARD_STATUS.READY]: 'green',
  [DASHBOARD_STATUS.ERROR]: 'red',
  [DASHBOARD_STATUS.OFFLINE]: 'gray',
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const DASHBOARD_STATUS_OPTIONS = Object.entries(DASHBOARD_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as DashboardStatus, label })
);

export const DATE_RANGE_TYPE_OPTIONS = Object.entries(DATE_RANGE_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as DateRangeType, label })
);

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidDashboardStatus = (status: string): status is DashboardStatus => {
  return Object.values(DASHBOARD_STATUS).includes(status as DashboardStatus);
};

export const isValidDateRangeType = (type: string): type is DateRangeType => {
  return Object.values(DATE_RANGE_TYPE).includes(type as DateRangeType);
};

export const isDashboardReady = (status: DashboardStatus): boolean => {
  return status === DASHBOARD_STATUS.READY;
};

export const isDashboardLoading = (status: DashboardStatus): boolean => {
  return status === DASHBOARD_STATUS.LOADING;
};

export const isDashboardError = (status: DashboardStatus): boolean => {
  return status === DASHBOARD_STATUS.ERROR;
};

export const isDashboardOffline = (status: DashboardStatus): boolean => {
  return status === DASHBOARD_STATUS.OFFLINE;
};

export const getDashboardStatusIcon = (status: DashboardStatus): string => {
  const iconMap = {
    [DASHBOARD_STATUS.LOADING]: '⏳',
    [DASHBOARD_STATUS.READY]: '✅',
    [DASHBOARD_STATUS.ERROR]: '❌',
    [DASHBOARD_STATUS.OFFLINE]: '📴',
  };

  return iconMap[status];
};

export const getDateRangeTypeIcon = (type: DateRangeType): string => {
  const iconMap = {
    [DATE_RANGE_TYPE.WEEK]: '📅',
    [DATE_RANGE_TYPE.MONTH]: '📆',
    [DATE_RANGE_TYPE.QUARTER]: '🗓️',
    [DATE_RANGE_TYPE.YEAR]: '📊',
    [DATE_RANGE_TYPE.CUSTOM]: '⚙️',
  };

  return iconMap[type];
};

// 날짜 범위 계산 헬퍼
export const getDateRange = (type: DateRangeType): { start: Date; end: Date } | null => {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (type) {
    case DATE_RANGE_TYPE.WEEK:
      start.setDate(now.getDate() - 7);
      return { start, end };

    case DATE_RANGE_TYPE.MONTH:
      start.setMonth(now.getMonth() - 1);
      return { start, end };

    case DATE_RANGE_TYPE.QUARTER:
      start.setMonth(now.getMonth() - 3);
      return { start, end };

    case DATE_RANGE_TYPE.YEAR:
      start.setFullYear(now.getFullYear() - 1);
      return { start, end };

    case DATE_RANGE_TYPE.CUSTOM:
      return null; // 사용자가 직접 설정

    default:
      return null;
  }
};

// 날짜 범위별 기본 새로고침 간격 (밀리초)
export const getDefaultRefreshInterval = (type: DateRangeType): number => {
  const intervalMap = {
    [DATE_RANGE_TYPE.WEEK]: 5 * 60 * 1000,    // 5분
    [DATE_RANGE_TYPE.MONTH]: 15 * 60 * 1000,  // 15분
    [DATE_RANGE_TYPE.QUARTER]: 60 * 60 * 1000, // 1시간
    [DATE_RANGE_TYPE.YEAR]: 6 * 60 * 60 * 1000, // 6시간
    [DATE_RANGE_TYPE.CUSTOM]: 10 * 60 * 1000,   // 10분
  };

  return intervalMap[type];
};
