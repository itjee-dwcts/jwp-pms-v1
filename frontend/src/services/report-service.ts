import { apiClient } from '../services/api-client';
import type {
  ExportOptions,
  ExportStatus,
  ProjectReport,
  ReportData,
  ReportFilters,
  ReportMetrics,
  ReportTemplate,
  ScheduledReport,
  TaskReport,
  TimeTrackingReport,
  UserReport,
} from '../types/report';
import { buildQueryParams } from '../utils/query-params';

export class ReportService {
  private readonly baseUrl = '/api/v1/reports';

  // Comprehensive Reports
  async getReports(filters: ReportFilters): Promise<ReportData> {
    const queryString = buildQueryParams(filters);
    return apiClient.request<ReportData>(`${this.baseUrl}?${queryString}`);
  }

  async getReportMetrics(filters: Partial<ReportFilters> = {}): Promise<ReportMetrics> {
    const queryString = buildQueryParams(filters);
    return apiClient.request<ReportMetrics>(`${this.baseUrl}/metrics?${queryString}`);
  }

  // Specific Report Types
  async getProjectReport(projectId: string, filters: Partial<ReportFilters> = {}): Promise<ProjectReport> {
    const queryString = buildQueryParams(filters);
    return apiClient.request<ProjectReport>(`/api/v1/projects/${projectId}/reports?${queryString}`);
  }

  async getUserReport(userId: string, filters: Partial<ReportFilters> = {}): Promise<UserReport> {
    const queryString = buildQueryParams(filters);
    return apiClient.request<UserReport>(`/api/v1/users/${userId}/reports?${queryString}`);
  }

  async getTaskReport(filters: Partial<ReportFilters> = {}): Promise<TaskReport> {
    const queryString = buildQueryParams(filters);
    return apiClient.request<TaskReport>(`${this.baseUrl}/tasks?${queryString}`);
  }

  async getTimeTrackingReport(filters: Partial<ReportFilters> = {}): Promise<TimeTrackingReport> {
    const queryString = buildQueryParams(filters);
    return apiClient.request<TimeTrackingReport>(`${this.baseUrl}/time-tracking?${queryString}`);
  }

  // Export Reports (즉시 다운로드)
  async exportReport(options: ExportOptions): Promise<Blob> {
    const queryString = buildQueryParams({
      type: options.type,
      format: options.format,
      ...options.filters,
      template: options.template,
      include_charts: options.include_charts,
      include_raw_data: options.include_raw_data,
    });

    const response = await fetch(`${this.baseUrl}/export?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export report');
    }

    return response.blob();
  }

  // 비동기 Export 관련 메서드들 (추가)
  async startAsyncExport(options: ExportOptions): Promise<string> {
    const response = await apiClient.request<{ export_id: string }>(`${this.baseUrl}/export/async`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return response.export_id;
  }

  async getExportStatus(exportId: string): Promise<ExportStatus> {
    return apiClient.request<ExportStatus>(`${this.baseUrl}/export/${exportId}/status`);
  }

  async downloadExport(exportId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/export/${exportId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download export');
    }

    return response.blob();
  }

  async cancelExport(exportId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/export/${exportId}/cancel`, {
      method: 'POST',
    });
  }

  async getExportHistory(params?: {
    page_no?: number;
    page_size?: number;
    format?: string;
    status?: string;
  }): Promise<{
    exports: ExportStatus[];
    total_items: number;
    page_no: number;
    page_size: number;
  }> {
    const queryString = buildQueryParams(params || {});
    return apiClient.request(`${this.baseUrl}/export/history?${queryString}`);
  }

  async downloadReport(blob: Blob, filename: string): Promise<void> {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Report Templates
  async getReportTemplates(): Promise<ReportTemplate[]> {
    return apiClient.request<ReportTemplate[]>(`${this.baseUrl}/templates`);
  }

  async createReportTemplate(template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> {
    return apiClient.request<ReportTemplate>(`${this.baseUrl}/templates`, {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateReportTemplate(id: string, template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    return apiClient.request<ReportTemplate>(`${this.baseUrl}/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  }

  async deleteReportTemplate(id: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Scheduled Reports
  async getScheduledReports(): Promise<ScheduledReport[]> {
    return apiClient.request<ScheduledReport[]>(`${this.baseUrl}/scheduled`);
  }

  async createScheduledReport(report: Omit<ScheduledReport, 'id'>): Promise<ScheduledReport> {
    return apiClient.request<ScheduledReport>(`${this.baseUrl}/scheduled`, {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async updateScheduledReport(id: string, report: Partial<ScheduledReport>): Promise<ScheduledReport> {
    return apiClient.request<ScheduledReport>(`${this.baseUrl}/scheduled/${id}`, {
      method: 'PUT',
      body: JSON.stringify(report),
    });
  }

  async deleteScheduledReport(id: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/scheduled/${id}`, {
      method: 'DELETE',
    });
  }

  // Utility Functions
  generateDateRange(range: ReportFilters['dateRange']): { startDate: string; endDate: string } {
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        // For custom range, return current date as both start and end
        return {
          startDate: now.toISOString().split('T')[0] ?? '',
          endDate: now.toISOString().split('T')[0] ?? '',
        };
    }

    return {
      startDate: startDate.toISOString().split('T')[0] as string,
      endDate: now.toISOString().split('T')[0] as string,
    };
  }

  calculateCompletionRate(completed: number, total: number): number {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateFilename(type: string, format: string, timestamp?: string): string {
    const ts = timestamp || new Date().toISOString().split('T')[0];
    return `${type}_report_${ts}.${format}`;
  }

  // 새로 추가된 유틸리티 함수들
  validateExportOptions(options: ExportOptions): string[] {
    const errors: string[] = [];

    if (!options.type) {
      errors.push('Report type is required');
    }

    if (!options.format) {
      errors.push('Export format is required');
    }

    const supportedFormats = this.getSupportedFormats(options.type);
    if (!supportedFormats.includes(options.format as any)) {
      errors.push(`Format ${options.format} is not supported for ${options.type} reports`);
    }

    if (options.filters?.dateRange === 'custom') {
      if (!options.filters.startDate || !options.filters.endDate) {
        errors.push('Start date and end date are required for custom date range');
      }
    }

    return errors;
  }

  getSupportedFormats(reportType: string): string[] {
    const formatMap: Record<string, string[]> = {
      overview: ['pdf', 'excel'],
      projects: ['pdf', 'csv', 'excel'],
      tasks: ['csv', 'excel', 'json'],
      users: ['csv', 'excel'],
      productivity: ['pdf', 'excel'],
      timeline: ['pdf', 'excel'],
    };

    return formatMap[reportType] || ['pdf', 'csv', 'excel'];
  }

  estimateFileSize(options: ExportOptions): string {
    const baseSize = options.format === 'pdf' ? 500 : 100; // KB
    const chartMultiplier = options.include_charts ? 2 : 1;
    const dataMultiplier = options.include_raw_data ? 3 : 1;

    const estimatedSizeKB = baseSize * chartMultiplier * dataMultiplier;

    if (estimatedSizeKB < 1024) {
      return `~${estimatedSizeKB}KB`;
    } else {
      return `~${(estimatedSizeKB / 1024).toFixed(1)}MB`;
    }
  }
}

// Singleton instance
export const reportService = new ReportService();
