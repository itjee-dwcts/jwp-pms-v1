import { ApiResponse } from '@/types';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';
import { APP_CONSTANTS, config } from './config';

/**
 * API Client class for handling HTTP requests
 */
class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: config.API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return this.instance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(null, newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): void {
    const message = this.extractErrorMessage(error);
    const status = error.response?.status;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error (${status}):`, {
        message,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
      });
    }

    // Show user-friendly error messages
    switch (status) {
      case 400:
        toast.error(message || 'Invalid request. Please check your input.');
        break;
      case 401:
        // Don't show toast for 401 as it's handled by refresh logic
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('The requested resource was not found.');
        break;
      case 409:
        toast.error(message || 'A conflict occurred. Please try again.');
        break;
      case 422:
        toast.error(message || 'Validation failed. Please check your input.');
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      case 503:
        toast.error('Service temporarily unavailable. Please try again later.');
        break;
      default:
        if (!navigator.onLine) {
          toast.error('You are offline. Please check your internet connection.');
        } else {
          toast.error(message || 'An unexpected error occurred.');
        }
    }
  }

  /**
   * Extract error message from response
   */
  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stored authentication token
   */
  private getToken(): string | null {
    return localStorage.getItem(APP_CONSTANTS.TOKEN_STORAGE_KEY);
  }

  /**
   * Get stored refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(APP_CONSTANTS.REFRESH_TOKEN_STORAGE_KEY);
  }

  /**
   * Set authentication tokens
   */
  public setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(APP_CONSTANTS.TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(APP_CONSTANTS.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }

  /**
   * Clear authentication data
   */
  public clearAuth(): void {
    localStorage.removeItem(APP_CONSTANTS.TOKEN_STORAGE_KEY);
    localStorage.removeItem(APP_CONSTANTS.REFRESH_TOKEN_STORAGE_KEY);
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(
      `${config.API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 10000 }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    this.setTokens(accessToken, newRefreshToken);

    return accessToken;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  /**
   * GET request
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.get(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.put(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.patch(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.delete(url, config);
    return response.data;
  }

  /**
   * Upload file with progress tracking
   */
  public async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional data if provided
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  /**
   * Download file
   */
  public async downloadFile(url: string, filename?: string): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Get request with caching
   */
  public async getWithCache<T = any>(
    url: string,
    cacheKey: string,
    ttl: number = 5 * 60 * 1000, // 5 minutes
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const cachedData = this.getCachedData(cacheKey);

    if (cachedData && !this.isCacheExpired(cachedData.timestamp, ttl)) {
      return cachedData.data;
    }

    const response = await this.get<T>(url, config);
    this.setCachedData(cacheKey, response);

    return response;
  }

  /**
   * Cache data with timestamp
   */
  private setCachedData(key: string, data: any): void {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
  }

  /**
   * Get cached data
   */
  private getCachedData(key: string): any {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if cache is expired
   */
  private isCacheExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  }

  /**
   * Clear cache
   */
  public clearCache(key?: string): void {
    if (key) {
      localStorage.removeItem(`cache_${key}`);
    } else {
      // Clear all cache items
      Object.keys(localStorage)
        .filter(key => key.startsWith('cache_'))
        .forEach(key => localStorage.removeItem(key));
    }
  }
}

// ============================================================================
// API Service Functions
// ============================================================================

// Create API client instance
export const apiClient = new ApiClient();

// Authentication API
export const authApi = {
  login: (data: { usernameOrEmail: string; password: string }) =>
    apiClient.post('/auth/login', data),

  register: (data: { username: string; email: string; firstName: string; lastName: string; password: string }) =>
    apiClient.post('/auth/register', data),

  logout: () =>
    apiClient.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch('/auth/change-password', { currentPassword, newPassword }),

  getProfile: () =>
    apiClient.get('/auth/profile'),

  updateProfile: (data: any) =>
    apiClient.patch('/auth/profile', data),
};

// Users API
export const usersApi = {
  getUsers: (params?: any) =>
    apiClient.get('/users', { params }),

  getUser: (id: string) =>
    apiClient.get(`/users/${id}`),

  createUser: (data: any) =>
    apiClient.post('/users', data),

  updateUser: (id: string, data: any) =>
    apiClient.patch(`/users/${id}`, data),

  deleteUser: (id: string) =>
    apiClient.delete(`/users/${id}`),

  uploadAvatar: (id: string, file: File, onProgress?: (progress: number) => void) =>
    apiClient.uploadFile(`/users/${id}/avatar`, file, onProgress),
};

// Projects API
export const projectsApi = {
  getProjects: (params?: any) =>
    apiClient.get('/projects', { params }),

  getProject: (id: string) =>
    apiClient.get(`/projects/${id}`),

  createProject: (data: any) =>
    apiClient.post('/projects', data),

  updateProject: (id: string, data: any) =>
    apiClient.patch(`/projects/${id}`, data),

  deleteProject: (id: string) =>
    apiClient.delete(`/projects/${id}`),

  getProjectMembers: (id: string) =>
    apiClient.get(`/projects/${id}/members`),

  addProjectMember: (id: string, userId: string, role: string) =>
    apiClient.post(`/projects/${id}/members`, { userId, role }),

  removeProjectMember: (id: string, userId: string) =>
    apiClient.delete(`/projects/${id}/members/${userId}`),

  getProjectComments: (id: string) =>
    apiClient.get(`/projects/${id}/comments`),

  getProjectAttachments: (id: string) =>
    apiClient.get(`/projects/${id}/attachments`),

  getProjectAnalytics: (id: string) =>
    apiClient.get(`/projects/${id}/analytics`),
};

// Tasks API
export const tasksApi = {
  getTasks: (params?: any) =>
    apiClient.get('/tasks', { params }),

  getTask: (id: string) =>
    apiClient.get(`/tasks/${id}`),

  createTask: (data: any) =>
    apiClient.post('/tasks', data),

  updateTask: (id: string, data: any) =>
    apiClient.patch(`/tasks/${id}`, data),

  deleteTask: (id: string) =>
    apiClient.delete(`/tasks/${id}`),

  assignTask: (id: string, userIds: string[]) =>
    apiClient.post(`/tasks/${id}/assign`, { userIds }),

  unassignTask: (id: string, userIds: string[]) =>
    apiClient.post(`/tasks/${id}/unassign`, { userIds }),

  getTaskComments: (id: string) =>
    apiClient.get(`/tasks/${id}/comments`),

  getTaskAttachments: (id: string) =>
    apiClient.get(`/tasks/${id}/attachments`),

  logTime: (id: string, hours: number, description?: string) =>
    apiClient.post(`/tasks/${id}/time-log`, { hours, description }),
};

// Comments API
export const commentsApi = {
  getComments: (params?: any) =>
    apiClient.get('/comments', { params }),

  getComment: (id: string) =>
    apiClient.get(`/comments/${id}`),

  createComment: (data: any) =>
    apiClient.post('/comments', data),

  updateComment: (id: string, data: any) =>
    apiClient.patch(`/comments/${id}`, data),

  deleteComment: (id: string) =>
    apiClient.delete(`/comments/${id}`),
};

// Events API
export const eventsApi = {
  getEvents: (params?: any) =>
    apiClient.get('/events', { params }),

  getEvent: (id: string) =>
    apiClient.get(`/events/${id}`),

  createEvent: (data: any) =>
    apiClient.post('/events', data),

  updateEvent: (id: string, data: any) =>
    apiClient.patch(`/events/${id}`, data),

  deleteEvent: (id: string) =>
    apiClient.delete(`/events/${id}`),
};

// Attachments API
export const attachmentsApi = {
  uploadFile: (file: File, metadata?: any, onProgress?: (progress: number) => void) =>
    apiClient.uploadFile('/attachments/upload', file, onProgress, metadata),

  downloadFile: (id: string, filename?: string) =>
    apiClient.downloadFile(`/attachments/${id}/download`, filename),

  deleteFile: (id: string) =>
    apiClient.delete(`/attachments/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    apiClient.getWithCache('/dashboard/stats', APP_CONSTANTS.CACHE_KEYS.DASHBOARD_STATS),

  getActivity: (params?: any) =>
    apiClient.get('/dashboard/activity', { params }),

  getAnalytics: (params?: any) =>
    apiClient.get('/dashboard/analytics', { params }),
};

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: any) =>
    apiClient.get('/notifications', { params }),

  markAsRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.patch('/notifications/read-all'),

  deleteNotification: (id: string) =>
    apiClient.delete(`/notifications/${id}`),
};

// Settings API
export const settingsApi = {
  getUserSettings: () =>
    apiClient.get('/settings/user'),

  updateUserSettings: (data: any) =>
    apiClient.patch('/settings/user', data),

  updateTheme: (theme: any) =>
    apiClient.patch('/settings/theme', theme),

  updateNotificationSettings: (settings: any) =>
    apiClient.patch('/settings/notifications', settings),
};

// Admin API
export const adminApi = {
  getUsers: (params?: any) =>
    apiClient.get('/admin/users', { params }),

  getRoles: () =>
    apiClient.get('/admin/roles'),

  getPermissions: () =>
    apiClient.get('/admin/permissions'),

  getSystemInfo: () =>
    apiClient.get('/admin/system'),

  getLogs: (params?: any) =>
    apiClient.get('/admin/logs', { params }),
};

// Export default client for direct usage
export default apiClient;
