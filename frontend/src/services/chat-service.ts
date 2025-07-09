// frontend/src/services/chat-service.ts
/**
 * 채팅 서비스 - ChatService 클래스
 *
 * OpenAI API와 연동하는 채팅 기능을 위한 API 호출 서비스
 * CalendarService와 동일한 클래스 기반 구조 사용
 */

import {
  ChatMessageCreateRequest,
  ChatMessageListResponse,
  ChatMessageResponse,
  ChatMessageSearchRequest,
  ChatMessageUpdateRequest,
  ChatSessionCreateRequest,
  ChatSessionListResponse,
  ChatSessionResponse,
  ChatSessionSearchRequest,
  ChatSessionUpdateRequest,
  ChatTemplateCreateRequest,
  ChatTemplateListResponse,
  ChatTemplateResponse,
  ChatTemplateSearchRequest,
  ChatTemplateUpdateRequest,
  ChatUsageStatsResponse,
  OpenAIMessageRequest,
  OpenAIResponse,
} from '../types/chat';
import { apiClient } from './api-client';

export class ChatService {
  private readonly baseUrl = '/api/v1/chat';

  // ============================================================================
  // 채팅 세션 관리 API
  // ============================================================================

  /**
   * 새로운 채팅 세션 생성
   */
  async createChatSession(data: ChatSessionCreateRequest): Promise<ChatSessionResponse> {
    return apiClient.request<ChatSessionResponse>(`${this.baseUrl}/sessions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 채팅 세션 목록 조회
   */
  async listChatSessions(params?: ChatSessionSearchRequest): Promise<ChatSessionListResponse> {
    let url = `${this.baseUrl}/sessions`;
    if (params) {
      const query = new URLSearchParams(params as any).toString();
      url += `?${query}`;
    }
    return apiClient.request<ChatSessionListResponse>(url, {
      method: 'GET',
    });
  }

  /**
   * 특정 채팅 세션 조회
   */
  async getChatSession(sessionId: string): Promise<ChatSessionResponse> {
    return apiClient.request<ChatSessionResponse>(
      `${this.baseUrl}/sessions/${sessionId}`
    );
  }

  /**
   * 채팅 세션 정보 수정
   */
  async updateChatSession(
    sessionId: string,
    data: ChatSessionUpdateRequest
  ): Promise<ChatSessionResponse> {
    return apiClient.request<ChatSessionResponse>(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 채팅 세션 삭제
   */
  async deleteChatSession(sessionId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // 채팅 메시지 관리 API
  // ============================================================================

  /**
   * 세션의 메시지 목록 조회
   */
  async listChatMessages(
    sessionId: string,
    params?: ChatMessageSearchRequest
  ): Promise<ChatMessageListResponse> {
    let url = `${this.baseUrl}/sessions/${sessionId}/messages`;
    if (params) {
      const query = new URLSearchParams(params as any).toString();
      url += `?${query}`;
    }
    return apiClient.request<ChatMessageListResponse>(url, {
      method: 'GET',
    });
  }

  /**
   * 새 메시지 생성 (사용자 메시지 저장용)
   */
  async createChatMessage(data: ChatMessageCreateRequest): Promise<ChatMessageResponse> {
    return apiClient.request<ChatMessageResponse>(`${this.baseUrl}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 메시지 수정
   */
  async updateChatMessage(
    messageId: string,
    data: ChatMessageUpdateRequest
  ): Promise<ChatMessageResponse> {
    return apiClient.request<ChatMessageResponse>(`${this.baseUrl}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 메시지 삭제
   */
  async deleteChatMessage(messageId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // OpenAI API 연동
  // ============================================================================

  /**
   * OpenAI API에 메시지 전송하고 AI 응답 받기
   */
  async sendMessageToAI(request: OpenAIMessageRequest): Promise<OpenAIResponse> {
    return apiClient.request<OpenAIResponse>(`${this.baseUrl}/send`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 스트리밍 응답으로 메시지 전송
   */
  async sendMessageToAIStream(request: OpenAIMessageRequest): Promise<ReadableStream> {
    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/send-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiClient.accessToken}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Stream request failed');
    }

    return response.body || new ReadableStream();
  }

  // ============================================================================
  // 채팅 템플릿 관리 API
  // ============================================================================

  /**
   * 새로운 채팅 템플릿 생성
   */
  async createChatTemplate(data: ChatTemplateCreateRequest): Promise<ChatTemplateResponse> {
    return apiClient.request<ChatTemplateResponse>(`${this.baseUrl}/templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 채팅 템플릿 목록 조회
   */
  async listChatTemplates(params?: ChatTemplateSearchRequest): Promise<ChatTemplateListResponse> {
    let url = `${this.baseUrl}/templates`;
    if (params) {
      const query = new URLSearchParams(params as any).toString();
      url += `?${query}`;
    }
    return apiClient.request<ChatTemplateListResponse>(url, {
      method: 'GET',
    });
  }

  /**
   * 특정 채팅 템플릿 조회
   */
  async getChatTemplate(templateId: string): Promise<ChatTemplateResponse> {
    return apiClient.request<ChatTemplateResponse>(
      `${this.baseUrl}/templates/${templateId}`
    );
  }

  /**
   * 채팅 템플릿 수정
   */
  async updateChatTemplate(
    templateId: string,
    data: ChatTemplateUpdateRequest
  ): Promise<ChatTemplateResponse> {
    return apiClient.request<ChatTemplateResponse>(`${this.baseUrl}/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 채팅 템플릿 삭제
   */
  async deleteChatTemplate(templateId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 템플릿 사용 횟수 증가
   */
  async incrementTemplateUsage(templateId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/templates/${templateId}/use`, {
      method: 'POST',
    });
  }

  /**
   * 템플릿 좋아요 토글
   */
  async toggleTemplateLike(templateId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/templates/${templateId}/like`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // 사용량 통계 API
  // ============================================================================

  /**
   * 채팅 사용량 통계 조회
   */
  async getChatUsageStats(params?: {
    period_type?: string;
    days?: number;
  }): Promise<ChatUsageStatsResponse[]> {
    let url = `${this.baseUrl}/usage-stats`;
    if (params) {
      const query = new URLSearchParams(params as any).toString();
      url += `?${query}`;
    }
    return apiClient.request<ChatUsageStatsResponse[]>(url, {
      method: 'GET',
    });
  }

  /**
   * 사용자별 채팅 요약 통계 조회
   */
  async getChatSummaryStats(): Promise<{
    total_sessions: number;
    total_messages: number;
    total_tokens: number;
    total_cost: string;
    favorite_model: string;
  }> {
    return apiClient.request(`${this.baseUrl}/stats/summary`);
  }

  // ============================================================================
  // 채팅 내보내기/가져오기 API
  // ============================================================================

  /**
   * 채팅 세션 내보내기
   */
  async exportChatSession(
    sessionId: string,
    format: 'json' | 'txt' | 'pdf' = 'json'
  ): Promise<Blob> {
    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/sessions/${sessionId}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  /**
   * 여러 채팅 세션 일괄 내보내기
   */
  async exportMultipleChatSessions(
    sessionIds: string[],
    format: 'json' | 'txt' | 'pdf' = 'json'
  ): Promise<Blob> {
    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/sessions/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
      body: JSON.stringify({ session_ids: sessionIds, format }),
    });

    if (!response.ok) {
      throw new Error('Bulk export failed');
    }

    return response.blob();
  }

  /**
   * 채팅 데이터 가져오기
   */
  async importChatData(file: File): Promise<{
    imported_sessions: number;
    imported_messages: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Import failed');
    }

    return response.json();
  }

  // ============================================================================
  // 채팅 검색 API
  // ============================================================================

  /**
   * 전체 채팅 검색
   */
  async searchChatGlobally(params: {
    query: string;
    session_ids?: string[];
    start_date?: string;
    end_date?: string;
    message_roles?: string[];
    page_no?: number;
    page_size?: number;
  }): Promise<{
    messages: ChatMessageResponse[];
    sessions: ChatSessionResponse[];
    total_count: number;
    page_no: number;
    page_size: number;
  }> {
    let url = `${this.baseUrl}/search`;
    if (params) {
      const query = new URLSearchParams(params as any).toString();
      url += `?${query}`;
    }
    return apiClient.request(url, {
      method: 'GET',
    });
  }

  // ============================================================================
  // 채팅 파일 관리 API
  // ============================================================================

  /**
   * 채팅 파일 업로드
   */
  async uploadChatFile(
    sessionId: string,
    file: File,
    description?: string
  ): Promise<{
    file_id: string;
    file_name: string;
    file_url: string;
    file_size: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${apiClient.baseUrl}${this.baseUrl}/sessions/${sessionId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'File upload failed');
    }

    return response.json();
  }

  /**
   * 채팅 파일 삭제
   */
  async deleteChatFile(sessionId: string, fileId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/sessions/${sessionId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 채팅 파일 목록 조회
   */
  async listChatFiles(sessionId: string): Promise<{
    files: Array<{
      file_id: string;
      file_name: string;
      file_url: string;
      file_size: number;
      uploaded_at: string;
    }>;
  }> {
    return apiClient.request(`${this.baseUrl}/sessions/${sessionId}/files`);
  }

  // ============================================================================
  // 채팅 설정 및 관리 API
  // ============================================================================

  /**
   * 채팅 세션 복제
   */
  async duplicateChatSession(
    sessionId: string,
    newTitle?: string
  ): Promise<ChatSessionResponse> {
    return apiClient.request<ChatSessionResponse>(`${this.baseUrl}/sessions/${sessionId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ new_title: newTitle }),
    });
  }

  /**
   * 채팅 세션 아카이브
   */
  async archiveChatSession(sessionId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/sessions/${sessionId}/archive`, {
      method: 'POST',
    });
  }

  /**
   * 채팅 세션 복원
   */
  async restoreChatSession(sessionId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/sessions/${sessionId}/restore`, {
      method: 'POST',
    });
  }

  /**
   * 메시지 재생성 요청
   */
  async regenerateMessage(messageId: string): Promise<ChatMessageResponse> {
    return apiClient.request<ChatMessageResponse>(`${this.baseUrl}/messages/${messageId}/regenerate`, {
      method: 'POST',
    });
  }

  /**
   * 메시지 피드백 전송
   */
  async sendMessageFeedback(
    messageId: string,
    feedback: {
      rating: 'positive' | 'negative';
      comment?: string;
      categories?: string[];
    }
  ): Promise<void> {
    await apiClient.request(`${this.baseUrl}/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  /**
   * 대화 요약 생성
   */
  async generateConversationSummary(sessionId: string): Promise<{
    summary: string;
    key_points: string[];
    total_messages: number;
    total_tokens: number;
  }> {
    return apiClient.request(`${this.baseUrl}/sessions/${sessionId}/summarize`, {
      method: 'POST',
    });
  }

  /**
   * 채팅 설정 조회
   */
  async getChatSettings(): Promise<{
    max_sessions_per_user: number;
    max_messages_per_session: number;
    supported_models: string[];
    file_upload_enabled: boolean;
    max_file_size: number;
  }> {
    return apiClient.request(`${this.baseUrl}/settings`);
  }

  /**
   * 시스템 상태 확인
   */
  async getChatSystemStatus(): Promise<{
    status: 'online' | 'maintenance' | 'degraded';
    openai_status: 'available' | 'unavailable' | 'limited';
    estimated_response_time: number;
    queue_length: number;
  }> {
    return apiClient.request(`${this.baseUrl}/system/status`);
  }

  // ============================================================================
  // 유틸리티 메서드들
  // ============================================================================

  /**
   * 세션 제목 자동 생성
   */
  generateSessionTitle(firstMessage: string): string {
    // 첫 번째 메시지를 기반으로 세션 제목 생성
    if (!firstMessage || firstMessage.trim().length === 0) {
      return '새 채팅';
    }

    // 50자로 제한하고 의미있는 제목 만들기
    const cleanMessage = firstMessage.trim().replace(/\n/g, ' ');
    if (cleanMessage.length <= 50) {
      return cleanMessage;
    }

    // 50자에서 자르되 단어 단위로 자르기
    const truncated = cleanMessage.substring(0, 50);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > 20) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  }

  /**
   * 토큰 사용량에 따른 비용 계산 (클라이언트 측 추정)
   */
  estimateCost(model: string, tokens: number): number {
    // 2024년 기준 OpenAI 가격 (1000 토큰당 USD)
    const pricing: Record<string, number> = {
      'gpt-3.5-turbo': 0.002,
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-4-vision-preview': 0.01,
    };

    const pricePerToken = (pricing[model] || 0.002) / 1000;
    return tokens * pricePerToken;
  }

  /**
   * 메시지 내용 미리보기 텍스트 생성
   */
  generatePreviewText(content: string, maxLength: number = 100): string {
    if (!content || content.trim().length === 0) {
      return '메시지 없음';
    }

    const cleanContent = content.trim().replace(/\n/g, ' ');
    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }

    return cleanContent.substring(0, maxLength) + '...';
  }

  /**
   * 상대 시간 표시 (예: "5분 전", "2시간 전")
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return '방금 전';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}주 전`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}개월 전`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}년 전`;
  }

  /**
   * 파일 크기 포맷팅
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 메시지 검색을 위한 텍스트 정규화
   */
  normalizeSearchText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')  // 여러 공백을 하나로
      .replace(/[^\w\s가-힣]/g, '');  // 특수문자 제거 (한글 유지)
  }

  /**
   * 세션 필터링 헬퍼
   */
  filterSessions(
    sessions: ChatSessionResponse[],
    filters: {
      searchText?: string;
      status?: string;
      model?: string;
      isPinned?: boolean;
      isFavorite?: boolean;
    }
  ): ChatSessionResponse[] {
    return sessions.filter(session => {
      // 검색 텍스트 필터
      if (filters.searchText) {
        const searchTerm = this.normalizeSearchText(filters.searchText);
        const sessionText = this.normalizeSearchText(
          `${session.title} ${session.description || ''}`
        );
        if (!sessionText.includes(searchTerm)) {
          return false;
        }
      }

      // 상태 필터
      if (filters.status && session.status !== filters.status) {
        return false;
      }

      // 모델 필터
      if (filters.model && session.model !== filters.model) {
        return false;
      }

      // 고정 필터
      if (filters.isPinned !== undefined && session.is_pinned !== filters.isPinned) {
        return false;
      }

      // 즐겨찾기 필터
      if (filters.isFavorite !== undefined && session.is_favorite !== filters.isFavorite) {
        return false;
      }

      return true;
    });
  }

  /**
   * 세션 정렬 헬퍼
   */
  sortSessions(
    sessions: ChatSessionResponse[],
    sortBy: 'title' | 'created_at' | 'last_activity_at' | 'message_count' = 'last_activity_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): ChatSessionResponse[] {
    return [...sessions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'last_activity_at':
          aValue = new Date(a.last_activity_at).getTime();
          bValue = new Date(b.last_activity_at).getTime();
          break;
        case 'message_count':
          aValue = a.message_count;
          bValue = b.message_count;
          break;
        default:
          aValue = a.last_activity_at;
          bValue = b.last_activity_at;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }

  /**
   * 메시지 역할별 아이콘 반환
   */
  getMessageRoleIcon(role: string): string {
    const iconMap: Record<string, string> = {
      'user': '👤',
      'assistant': '🤖',
      'system': '⚙️',
    };
    return iconMap[role] || '💬';
  }

  /**
   * 모델별 색상 반환
   */
  getModelColor(model: string): string {
    const colorMap: Record<string, string> = {
      'gpt-3.5-turbo': 'green',
      'gpt-4': 'blue',
      'gpt-4-turbo': 'purple',
      'gpt-4-vision-preview': 'orange',
    };
    return colorMap[model] || 'gray';
  }

  /**
   * 세션 상태별 색상 반환
   */
  getSessionStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'active': 'green',
      'inactive': 'yellow',
      'archived': 'gray',
    };
    return colorMap[status] || 'gray';
  }

  // ============================================================================
  // 캐시 관련 유틸리티
  // ============================================================================

  /**
   * 로컬 스토리지에 세션 캐시 저장
   */
  cacheSessionsToLocal(sessions: ChatSessionResponse[]): void {
    try {
      localStorage.setItem('chat_sessions_cache', JSON.stringify({
        data: sessions,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('세션 캐시 저장 실패:', error);
    }
  }

  /**
   * 로컬 스토리지에서 세션 캐시 읽기
   */
  getCachedSessionsFromLocal(maxAge: number = 5 * 60 * 1000): ChatSessionResponse[] | null {
    try {
      const cached = localStorage.getItem('chat_sessions_cache');
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem('chat_sessions_cache');
        return null;
      }

      return data;
    } catch (error) {
      console.warn('세션 캐시 읽기 실패:', error);
      return null;
    }
  }

  /**
   * 세션 캐시 초기화
   */
  clearSessionCache(): void {
    try {
      localStorage.removeItem('chat_sessions_cache');
    } catch (error) {
      console.warn('세션 캐시 초기화 실패:', error);
    }
  }
}

// Singleton instance
export const chatService = new ChatService();
