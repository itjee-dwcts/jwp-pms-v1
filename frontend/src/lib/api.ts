// src/lib/api.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import {
    ApiResponse,
    CalendarEvent,
    CalendarEventCreateRequest,
    Comment,
    CommentCreateRequest,
    DashboardStats,
    FilterParams,
    LoginRequest,
    LoginResponse,
    PaginatedResponse,
    PaginationParams,
    Project,
    ProjectCreateRequest,
    ProjectUpdateRequest,
    Task,
    TaskCreateRequest,
    TaskUpdateRequest,
    User,
    UserCreateRequest,
    UserUpdateRequest,
} from '../types';

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 요청 인터셉터 - 토큰 자동 추가
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터 - 에러 처리 및 토큰 갱신
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.client.post('/api/v1/auth/refresh', {
                refresh_token: refreshToken,
              });

              const { access_token, refresh_token: newRefreshToken } = response.data;
              localStorage.setItem('access_token', access_token);
              localStorage.setItem('refresh_token', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // 에러 메시지 표시
        const errorMessage = error.response?.data?.message || 'An error occurred';
        if (error.response?.status !== 401) {
          toast.error(errorMessage);
        }

        return Promise.reject(error);
      }
    );
  }

  // 헬퍼 메서드
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }

  // 인증 API
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>({
      method: 'POST',
      url: '/api/v1/auth/login',
      data,
    });
  }

  async register(data: UserCreateRequest): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>({
      method: 'POST',
      url: '/api/v1/auth/register',
      data,
    });
  }

  async logout(): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: '/api/v1/auth/logout',
    });
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return this.request<LoginResponse>({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      data: { refresh_token: refreshToken },
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>({
      method: 'GET',
      url: '/api/v1/auth/me',
    });
  }

  // 사용자 API
  async getUsers(params?: FilterParams & PaginationParams): Promise<PaginatedResponse<User>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<PaginatedResponse<User>>({
      method: 'GET',
      url: `/api/v1/users?${queryString}`,
    });
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>({
      method: 'GET',
      url: `/api/v1/users/${id}`,
    });
  }

  async createUser(data: UserCreateRequest): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>({
      method: 'POST',
      url: '/api/v1/users',
      data,
    });
  }

  async updateUser(id: number, data: UserUpdateRequest): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>({
      method: 'PUT',
      url: `/api/v1/users/${id}`,
      data,
    });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/v1/users/${id}`,
    });
  }

  // 프로젝트 API
  async getProjects(params?: FilterParams & PaginationParams): Promise<PaginatedResponse<Project>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<PaginatedResponse<Project>>({
      method: 'GET',
      url: `/api/v1/projects?${queryString}`,
    });
  }

  async getProject(id: number): Promise<ApiResponse<Project>> {
    return this.request<ApiResponse<Project>>({
      method: 'GET',
      url: `/api/v1/projects/${id}`,
    });
  }

  async createProject(data: ProjectCreateRequest): Promise<ApiResponse<Project>> {
    return this.request<ApiResponse<Project>>({
      method: 'POST',
      url: '/api/v1/projects',
      data,
    });
  }

  async updateProject(id: number, data: ProjectUpdateRequest): Promise<ApiResponse<Project>> {
    return this.request<ApiResponse<Project>>({
      method: 'PUT',
      url: `/api/v1/projects/${id}`,
      data,
    });
  }

  async deleteProject(id: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/v1/projects/${id}`,
    });
  }

  async getProjectMembers(id: number): Promise<ApiResponse<User[]>> {
    return this.request<ApiResponse<User[]>>({
      method: 'GET',
      url: `/api/v1/projects/${id}/members`,
    });
  }

  async addProjectMember(projectId: number, userId: number): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/members`,
      data: { user_id: userId },
    });
  }

  async removeProjectMember(projectId: number, userId: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}/members/${userId}`,
    });
  }

  // 작업 API
  async getTasks(params?: FilterParams & PaginationParams): Promise<PaginatedResponse<Task>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<PaginatedResponse<Task>>({
      method: 'GET',
      url: `/api/v1/tasks?${queryString}`,
    });
  }

  async getTask(id: number): Promise<ApiResponse<Task>> {
    return this.request<ApiResponse<Task>>({
      method: 'GET',
      url: `/api/v1/tasks/${id}`,
    });
  }

  async createTask(data: TaskCreateRequest): Promise<ApiResponse<Task>> {
    return this.request<ApiResponse<Task>>({
      method: 'POST',
      url: '/api/v1/tasks',
      data,
    });
  }

  async updateTask(id: number, data: TaskUpdateRequest): Promise<ApiResponse<Task>> {
    return this.request<ApiResponse<Task>>({
      method: 'PUT',
      url: `/api/v1/tasks/${id}`,
      data,
    });
  }

  async deleteTask(id: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/v1/tasks/${id}`,
    });
  }

  async getTaskComments(id: number): Promise<ApiResponse<Comment[]>> {
    return this.request<ApiResponse<Comment[]>>({
      method: 'GET',
      url: `/api/v1/tasks/${id}/comments`,
    });
  }

  async createTaskComment(taskId: number, data: CommentCreateRequest): Promise<ApiResponse<Comment>> {
    return this.request<ApiResponse<Comment>>({
      method: 'POST',
      url: `/api/v1/tasks/${taskId}/comments`,
      data,
    });
  }

  // 댓글 API
  async getComment(id: number): Promise<ApiResponse<Comment>> {
    return this.request<ApiResponse<Comment>>({
      method: 'GET',
      url: `/api/v1/comments/${id}`,
    });
  }

  async updateComment(id: number, data: { content: string }): Promise<ApiResponse<Comment>> {
    return this.request<ApiResponse<Comment>>({
      method: 'PUT',
      url: `/api/v1/comments/${id}`,
      data,
    });
  }

  async deleteComment(id: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/v1/comments/${id}`,
    });
  }

  // 캘린더 API
  async getCalendarEvents(params?: { start_date?: string; end_date?: string }): Promise<ApiResponse<CalendarEvent[]>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<ApiResponse<CalendarEvent[]>>({
      method: 'GET',
      url: `/api/v1/calendar/events?${queryString}`,
    });
  }

  async getCalendarEvent(id: number): Promise<ApiResponse<CalendarEvent>> {
    return this.request<ApiResponse<CalendarEvent>>({
      method: 'GET',
      url: `/api/v1/calendar/events/${id}`,
    });
  }

  async createCalendarEvent(data: CalendarEventCreateRequest): Promise<ApiResponse<CalendarEvent>> {
    return this.request<ApiResponse<CalendarEvent>>({
      method: 'POST',
      url: '/api/v1/calendar/events',
      data,
    });
  }

  async updateCalendarEvent(id: number, data: Partial<CalendarEventCreateRequest>): Promise<ApiResponse<CalendarEvent>> {
    return this.request<ApiResponse<CalendarEvent>>({
      method: 'PUT',
      url: `/api/v1/calendar/events/${id}`,
      data,
    });
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/v1/calendar/events/${id}`,
    });
  }

  // 대시보드 API
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<ApiResponse<DashboardStats>>({
      method: 'GET',
      url: '/api/v1/dashboard/stats',
    });
  }

  // 파일 업로드 API
  async uploadFile(file: File, entityType: 'task' | 'project', entityId: number): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId.toString());

    return this.request<ApiResponse<{ url: string; filename: string }>>({
      method: 'POST',
      url: '/api/v1/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // 헬스 체크 API
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>({
      method: 'GET',
      url: '/health',
    });
  }

  async detailedHealthCheck(): Promise<{
    status: string;
    services: Record<string, string>;
    timestamp: string;
  }> {
    return this.request<{
      status: string;
      services: Record<string, string>;
      timestamp: string;
    }>({
      method: 'GET',
      url: '/health/detailed',
    });
  }
}

// API 클라이언트 인스턴스 생성 및 내보내기
export const apiClient = new ApiClient();

// 개별 API 함수들을 직접 내보내기 (편의를 위해)
export const {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskComments,
  createTaskComment,
  getComment,
  updateComment,
  deleteComment,
  getCalendarEvents,
  getCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getDashboardStats,
  uploadFile,
  healthCheck,
  detailedHealthCheck,
} = apiClient;
