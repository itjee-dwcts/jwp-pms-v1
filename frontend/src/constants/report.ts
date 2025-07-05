// ============================================================================
// constants/report.ts - 리포트 관련 상수 정의
// ============================================================================

// ============================================================================
// 리포트 타입
// ============================================================================
export const REPORT_TYPE = {
  OVERVIEW: 'overview',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  USERS: 'users',
  TIME_TRACKING: 'time-tracking',
} as const;

export type ReportType = typeof REPORT_TYPE[keyof typeof REPORT_TYPE];

// ============================================================================
// 내보내기 형식
// ============================================================================
export const EXPORT_FORMAT = {
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json',
} as const;

export type ExportFormat = typeof EXPORT_FORMAT[keyof typeof EXPORT_FORMAT];

// ============================================================================
// 리포트 상태
// ============================================================================
export const REPORT_STATUS = {
  DRAFT: 'draft',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ReportStatus = typeof REPORT_STATUS[keyof typeof REPORT_STATUS];

// ============================================================================
// 내보내기 상태 (확장된 버전)
// ============================================================================
export const EXPORT_STATUS_TYPE = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type ExportStatusType = typeof EXPORT_STATUS_TYPE[keyof typeof EXPORT_STATUS_TYPE];

// ============================================================================
// 라벨 매핑
// ============================================================================

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [REPORT_TYPE.OVERVIEW]: '개요',
  [REPORT_TYPE.PROJECTS]: '프로젝트',
  [REPORT_TYPE.TASKS]: '작업',
  [REPORT_TYPE.USERS]: '사용자',
  [REPORT_TYPE.TIME_TRACKING]: '시간 추적',
};

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  [EXPORT_FORMAT.PDF]: 'PDF',
  [EXPORT_FORMAT.CSV]: 'CSV',
  [EXPORT_FORMAT.EXCEL]: 'Excel',
  [EXPORT_FORMAT.JSON]: 'JSON',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [REPORT_STATUS.DRAFT]: '초안',
  [REPORT_STATUS.GENERATING]: '생성 중',
  [REPORT_STATUS.COMPLETED]: '완료',
  [REPORT_STATUS.FAILED]: '실패',
};

export const EXPORT_STATUS_TYPE_LABELS: Record<ExportStatusType, string> = {
  [EXPORT_STATUS_TYPE.PENDING]: '대기 중',
  [EXPORT_STATUS_TYPE.PROCESSING]: '처리 중',
  [EXPORT_STATUS_TYPE.COMPLETED]: '완료',
  [EXPORT_STATUS_TYPE.FAILED]: '실패',
  [EXPORT_STATUS_TYPE.CANCELLED]: '취소됨',
};

// ============================================================================
// 색상 매핑
// ============================================================================

export const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  [REPORT_TYPE.OVERVIEW]: 'blue',
  [REPORT_TYPE.PROJECTS]: 'green',
  [REPORT_TYPE.TASKS]: 'orange',
  [REPORT_TYPE.USERS]: 'purple',
  [REPORT_TYPE.TIME_TRACKING]: 'indigo',
};

export const EXPORT_FORMAT_COLORS: Record<ExportFormat, string> = {
  [EXPORT_FORMAT.PDF]: 'red',
  [EXPORT_FORMAT.CSV]: 'green',
  [EXPORT_FORMAT.EXCEL]: 'blue',
  [EXPORT_FORMAT.JSON]: 'purple',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  [REPORT_STATUS.DRAFT]: 'gray',
  [REPORT_STATUS.GENERATING]: 'blue',
  [REPORT_STATUS.COMPLETED]: 'green',
  [REPORT_STATUS.FAILED]: 'red',
};

export const EXPORT_STATUS_TYPE_COLORS: Record<ExportStatusType, string> = {
  [EXPORT_STATUS_TYPE.PENDING]: 'yellow',
  [EXPORT_STATUS_TYPE.PROCESSING]: 'blue',
  [EXPORT_STATUS_TYPE.COMPLETED]: 'green',
  [EXPORT_STATUS_TYPE.FAILED]: 'red',
  [EXPORT_STATUS_TYPE.CANCELLED]: 'gray',
};

// ============================================================================
// 옵션 배열
// ============================================================================

export const REPORT_TYPE_OPTIONS = Object.entries(REPORT_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as ReportType, label })
);

export const EXPORT_FORMAT_OPTIONS = Object.entries(EXPORT_FORMAT_LABELS).map(
  ([value, label]) => ({ value: value as ExportFormat, label })
);

export const REPORT_STATUS_OPTIONS = Object.entries(REPORT_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as ReportStatus, label })
);

export const EXPORT_STATUS_TYPE_OPTIONS = Object.entries(EXPORT_STATUS_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as ExportStatusType, label })
);

// ============================================================================
// 헬퍼 함수들
// ============================================================================

export const isValidReportType = (type: string): type is ReportType => {
  return Object.values(REPORT_TYPE).includes(type as ReportType);
};

export const isValidExportFormat = (format: string): format is ExportFormat => {
  return Object.values(EXPORT_FORMAT).includes(format as ExportFormat);
};

export const isValidReportStatus = (status: string): status is ReportStatus => {
  return Object.values(REPORT_STATUS).includes(status as ReportStatus);
};

export const isValidExportStatusType = (status: string): status is ExportStatusType => {
  return Object.values(EXPORT_STATUS_TYPE).includes(status as ExportStatusType);
};

export const isReportProcessing = (status: ReportStatus): boolean => {
  return status === REPORT_STATUS.GENERATING;
};

export const isReportCompleted = (status: ReportStatus): boolean => {
  return status === REPORT_STATUS.COMPLETED;
};

export const isReportFailed = (status: ReportStatus): boolean => {
  return status === REPORT_STATUS.FAILED;
};

export const isReportDraft = (status: ReportStatus): boolean => {
  return status === REPORT_STATUS.DRAFT;
};

export const isExportProcessing = (status: ExportStatusType): boolean => {
  return ([EXPORT_STATUS_TYPE.PENDING, EXPORT_STATUS_TYPE.PROCESSING] as ExportStatusType[]).includes(status);
};

export const isExportCompleted = (status: ExportStatusType): boolean => {
  return status === EXPORT_STATUS_TYPE.COMPLETED;
};

export const isExportFailed = (status: ExportStatusType): boolean => {
  return ([EXPORT_STATUS_TYPE.FAILED, EXPORT_STATUS_TYPE.CANCELLED] as ExportStatusType[]).includes(status);
};

export const getReportTypeIcon = (type: ReportType): string => {
  const iconMap = {
    [REPORT_TYPE.OVERVIEW]: '📋',
    [REPORT_TYPE.PROJECTS]: '📁',
    [REPORT_TYPE.TASKS]: '✅',
    [REPORT_TYPE.USERS]: '👥',
    [REPORT_TYPE.TIME_TRACKING]: '⏱️',
  };

  return iconMap[type];
};

export const getExportFormatIcon = (format: ExportFormat): string => {
  const iconMap = {
    [EXPORT_FORMAT.PDF]: '📄',
    [EXPORT_FORMAT.CSV]: '📊',
    [EXPORT_FORMAT.EXCEL]: '📈',
    [EXPORT_FORMAT.JSON]: '💾',
  };

  return iconMap[format];
};

export const getReportStatusIcon = (status: ReportStatus): string => {
  const iconMap = {
    [REPORT_STATUS.DRAFT]: '📝',
    [REPORT_STATUS.GENERATING]: '⚙️',
    [REPORT_STATUS.COMPLETED]: '✅',
    [REPORT_STATUS.FAILED]: '❌',
  };

  return iconMap[status];
};

export const getExportStatusTypeIcon = (status: ExportStatusType): string => {
  const iconMap = {
    [EXPORT_STATUS_TYPE.PENDING]: '⏳',
    [EXPORT_STATUS_TYPE.PROCESSING]: '⚙️',
    [EXPORT_STATUS_TYPE.COMPLETED]: '✅',
    [EXPORT_STATUS_TYPE.FAILED]: '❌',
    [EXPORT_STATUS_TYPE.CANCELLED]: '🚫',
  };

  return iconMap[status];
};

// 리포트 타입별 기본 파일명 접미사
export const getReportFilenameSuffix = (type: ReportType): string => {
  const suffixMap = {
    [REPORT_TYPE.OVERVIEW]: 'overview',
    [REPORT_TYPE.PROJECTS]: 'projects',
    [REPORT_TYPE.TASKS]: 'tasks',
    [REPORT_TYPE.USERS]: 'users',
    [REPORT_TYPE.TIME_TRACKING]: 'time_tracking',
  };

  return suffixMap[type];
};

// 내보내기 형식별 MIME 타입
export const getExportFormatMimeType = (format: ExportFormat): string => {
  const mimeTypeMap = {
    [EXPORT_FORMAT.PDF]: 'application/pdf',
    [EXPORT_FORMAT.CSV]: 'text/csv',
    [EXPORT_FORMAT.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    [EXPORT_FORMAT.JSON]: 'application/json',
  };

  return mimeTypeMap[format];
};

// 내보내기 형식별 파일 확장자
export const getExportFormatExtension = (format: ExportFormat): string => {
  const extensionMap = {
    [EXPORT_FORMAT.PDF]: '.pdf',
    [EXPORT_FORMAT.CSV]: '.csv',
    [EXPORT_FORMAT.EXCEL]: '.xlsx',
    [EXPORT_FORMAT.JSON]: '.json',
  };

  return extensionMap[format];
};
