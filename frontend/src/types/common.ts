// ============================================================================
// types/common.ts - 공통 타입 정의
// BaseEntity: 모든 엔티티의 기본 인터페이스 (id, created_at, updated_at 등)
// UUIDEntity: UUID 기반 엔티티 인터페이스
// PaginatedResponse: 페이지네이션 응답 구조
// ApiResponse: API 응답 기본 구조
// ValidationError: 유효성 검사 에러
// FileInfo: 파일 정보
// AuditLog: 감사 로그
// Notification: 알림
// Comment: 코멘트
// Tag: 태그
// Attachment: 첨부파일
// 그 외 다양한 공통 타입들 (Statistics, Setting, SystemInfo 등)
// ============================================================================

/**
 * 기본 엔티티 인터페이스
 * 모든 데이터베이스 엔티티가 상속하는 기본 필드들
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * UUID 기반 엔티티 인터페이스
 */
export interface UUIDEntity {
  id: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * 페이지네이션 요청 파라미터
 */
export interface PaginationParams {
  page_no?: number;
  page_size?: number;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  items: T[];
  page_no: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * 정렬 파라미터
 */
export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * 검색 파라미터
 */
export interface SearchParams {
  search?: string;
  search_fields?: string[];
}

/**
 * 날짜 범위 필터
 */
export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

/**
 * API 응답 기본 구조
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  timestamp?: string;
}

/**
 * API 에러 응답
 */
export interface ApiErrorResponse {
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
 * 유효성 검사 에러
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

/**
 * 파일 업로드 정보
 */
export interface FileInfo {
  id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  url: string;
  thumbnail_url?: string;
  uploaded_at: string;
  uploaded_by: string;
}

/**
 * 파일 업로드 요청
 */
export interface FileUploadRequest {
  file: File;
  description?: string;
  tags?: string[];
  is_public?: boolean;
}

/**
 * 파일 업로드 응답
 */
export interface FileUploadResponse {
  file: FileInfo;
  upload_url?: string;
  expires_at?: string;
}

/**
 * 메타데이터 인터페이스
 */
export interface Metadata {
  [key: string]: any;
}

/**
 * 감사 로그 기본 인터페이스
 */
export interface AuditLog extends BaseEntity {
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Metadata;
}

/**
 * 감사 로그 액션 타입
 */
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'archive'
  | 'restore';

/**
 * 상태 타입 (공통)
 */
export type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'archived';

/**
 * 우선순위 타입 (공통)
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

/**
 * 가시성 타입
 */
export type Visibility = 'public' | 'private' | 'internal' | 'confidential';

/**
 * 색상 테마
 */
export type ColorTheme =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'pink'
  | 'indigo'
  | 'gray';

/**
 * 알림 타입
 */
export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: NotificationType;
  priority: Priority;
  read_at?: string;
  action_url?: string;
  metadata?: Metadata;
}

/**
 * 알림 타입 열거형
 */
export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'reminder'
  | 'system';

/**
 * 코멘트 기본 인터페이스
 */
export interface Comment extends BaseEntity {
  content: string;
  author_id: string;
  entity_type: string;
  entity_id: string;
  parent_id?: string;
  is_edited: boolean;
  edited_at?: string;
  metadata?: Metadata;
}

/**
 * 태그 인터페이스
 */
export interface Tag {
  id: string;
  name: string;
  color?: ColorTheme;
  description?: string;
  usage_count?: number;
}

/**
 * 첨부파일 인터페이스
 */
export interface Attachment extends BaseEntity {
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  download_url: string;
  entity_type: string;
  entity_id: string;
  description?: string;
  is_public: boolean;
}

/**
 * 키-값 쌍 인터페이스
 */
export interface KeyValuePair {
  key: string;
  value: any;
  label?: string;
  description?: string;
}

/**
 * 선택 옵션 인터페이스
 */
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
}

/**
 * 통계 정보 기본 인터페이스
 */
export interface Statistics {
  total: number;
  active: number;
  inactive: number;
  created_today: number;
  created_this_week: number;
  created_this_month: number;
  updated_today: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
}

/**
 * 설정 인터페이스
 */
export interface Setting {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: string;
  description?: string;
  is_public: boolean;
  is_editable: boolean;
  default_value?: any;
  validation_rules?: Record<string, any>;
}

/**
 * 주소 인터페이스
 */
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * 연락처 정보
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    github?: string;
  };
}

/**
 * 시간대 정보
 */
export interface TimezoneInfo {
  timezone: string;
  offset: number;
  name: string;
  abbreviation: string;
}

/**
 * 언어 정보
 */
export interface LanguageInfo {
  code: string;
  name: string;
  native_name: string;
  flag?: string;
}

/**
 * 통화 정보
 */
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
}

/**
 * 지역화 설정
 */
export interface LocalizationSettings {
  language: LanguageInfo;
  timezone: TimezoneInfo;
  currency: CurrencyInfo;
  date_format: string;
  time_format: '12h' | '24h';
  first_day_of_week: 0 | 1; // 0 = Sunday, 1 = Monday
}

/**
 * 시스템 정보
 */
export interface SystemInfo {
  version: string;
  build: string;
  environment: 'development' | 'staging' | 'production';
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  database_version: string;
  last_backup: string;
}

/**
 * 헬스 체크 정보
 */
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    redis: boolean;
    storage: boolean;
    external_apis: boolean;
  };
  response_time: number;
  timestamp: string;
}

/**
 * 에러 정보
 */
export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  timestamp: string;
  user_id?: string;
  request_id?: string;
  url?: string;
  method?: string;
}

/**
 * 배치 작업 정보
 */
export interface BatchJob extends BaseEntity {
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  total_items: number;
  processed_items: number;
  failed_items: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Metadata;
}

/**
 * 웹훅 정보
 */
export interface Webhook extends BaseEntity {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
  last_triggered_at?: string;
  success_count: number;
  failure_count: number;
  headers?: Record<string, string>;
  timeout: number;
  retry_count: number;
}

/**
 * 백업 정보
 */
export interface BackupInfo {
  id: string;
  type: 'full' | 'incremental';
  status: 'in_progress' | 'completed' | 'failed';
  file_size: number;
  file_path: string;
  download_url?: string;
  created_at: string;
  expires_at?: string;
  metadata?: {
    tables_count: number;
    records_count: number;
    compression_ratio: number;
  };
}

/**
 * 내보내기/가져오기 작업 정보
 */
export interface ImportExportJob extends BaseEntity {
  type: 'import' | 'export';
  format: 'csv' | 'xlsx' | 'json' | 'xml';
  entity_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name: string;
  file_url?: string;
  total_records: number;
  processed_records: number;
  success_records: number;
  failed_records: number;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  settings: Record<string, any>;
}

/**
 * 캐시 정보
 */
export interface CacheInfo {
  key: string;
  value: any;
  ttl: number;
  created_at: string;
  accessed_at: string;
  hit_count: number;
  size: number;
}

/**
 * 레이트 리미트 정보
 */
export interface RateLimitInfo {
  identifier: string;
  limit: number;
  remaining: number;
  reset_time: string;
  window_size: number;
}

/**
 * 검색 결과 하이라이트
 */
export interface SearchHighlight {
  field: string;
  fragments: string[];
}

/**
 * 검색 결과
 */
export interface SearchResult<T = any> {
  item: T;
  score: number;
  highlights?: SearchHighlight[];
  explanation?: string;
}

/**
 * 팀 멤버 기본 정보
 */
export interface TeamMember {
  user_id: string;
  role: string;
  joined_at: string;
  permissions?: string[];
  is_active: boolean;
}

/**
 * 활동 피드 아이템
 */
export interface ActivityFeedItem extends BaseEntity {
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  description: string;
  metadata?: Metadata;
  visibility: Visibility;
}

/**
 * 즐겨찾기 아이템
 */
export interface FavoriteItem extends BaseEntity {
  user_id: string;
  entity_type: string;
  entity_id: string;
  notes?: string;
}

/**
 * 구독 정보
 */
export interface Subscription extends BaseEntity {
  user_id: string;
  entity_type: string;
  entity_id: string;
  notification_types: string[];
  is_active: boolean;
}

/**
 * 성능 메트릭
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

/**
 * API 사용량 통계
 */
export interface ApiUsageStats {
  endpoint: string;
  method: string;
  request_count: number;
  avg_response_time: number;
  error_rate: number;
  last_accessed: string;
}

/**
 * 기본 CRUD 작업 타입
 */
export type CrudOperation = 'create' | 'read' | 'update' | 'delete' | 'list';

/**
 * 엔티티 상태 변경 로그
 */
export interface StateChangeLog extends BaseEntity {
  entity_type: string;
  entity_id: string;
  from_state: string;
  to_state: string;
  reason?: string;
  metadata?: Metadata;
}

/**
 * 템플릿 정보
 */
export interface Template extends BaseEntity {
  name: string;
  type: string;
  content: any;
  description?: string;
  is_public: boolean;
  is_default: boolean;
  usage_count: number;
  tags?: string[];
}
