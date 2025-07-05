import { reportService } from '@/services/report-service';
import type {
  ExportOptions,
  ProjectReport,
  ReportData,
  ReportFilters,
  ReportMetrics,
  ReportTemplate,
  ScheduledReport,
  TaskReport,
  TimeTrackingReport,
  UserReport,
} from '@/types/report';
import { useCallback } from 'react';
import { useReportState } from './use-report-state';

export const useReports = () => {
  const reportState = useReportState();

  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<T> => {
    reportState.setLoading(true);
    reportState.setError(null);
    try {
      const result = await request();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      reportState.setError(errorMessage);
      throw err;
    } finally {
      reportState.setLoading(false);
    }
  }, [reportState]);

  // Comprehensive Reports
  const getReports = useCallback(async (filters: ReportFilters): Promise<ReportData> => {
    return handleRequest(async () => {
      const data = await reportService.getReports(filters);
      reportState.setReportData(data);
      return data;
    });
  }, [handleRequest, reportState]);

  const getReportMetrics = useCallback(async (filters: Partial<ReportFilters> = {}): Promise<ReportMetrics> => {
    return handleRequest(async () => {
      const metrics = await reportService.getReportMetrics(filters);
      reportState.setReportMetrics(metrics);
      return metrics;
    });
  }, [handleRequest, reportState]);

  // Specific Report Types
  const getProjectReport = useCallback(async (projectId: string, filters: Partial<ReportFilters> = {}): Promise<ProjectReport> => {
    return handleRequest(async () => {
      const report = await reportService.getProjectReport(projectId, filters);
      reportState.setProjectReport(report);
      return report;
    });
  }, [handleRequest, reportState]);

  const getUserReport = useCallback(async (userId: string, filters: Partial<ReportFilters> = {}): Promise<UserReport> => {
    return handleRequest(async () => {
      const report = await reportService.getUserReport(userId, filters);
      reportState.setUserReport(report);
      return report;
    });
  }, [handleRequest, reportState]);

  const getTaskReport = useCallback(async (filters: Partial<ReportFilters> = {}): Promise<TaskReport> => {
    return handleRequest(async () => {
      const report = await reportService.getTaskReport(filters);
      reportState.setTaskReport(report);
      return report;
    });
  }, [handleRequest, reportState]);

  const getTimeTrackingReport = useCallback(async (filters: Partial<ReportFilters> = {}): Promise<TimeTrackingReport> => {
    return handleRequest(async () => {
      const report = await reportService.getTimeTrackingReport(filters);
      reportState.setTimeTrackingReport(report);
      return report;
    });
  }, [handleRequest, reportState]);

  // Export Reports
  const exportReport = useCallback(async (options: ExportOptions): Promise<void> => {
    return handleRequest(async () => {
      reportState.setExportProgress(10);
      const blob = await reportService.exportReport(options);
      reportState.setExportProgress(80);

      const filename = reportService.generateFilename(options.type, options.format);
      await reportService.downloadReport(blob, filename);
      reportState.setExportProgress(100);

      setTimeout(() => reportState.setExportProgress(0), 1000);
    });
  }, [handleRequest, reportState]);

  // Templates
  const getReportTemplates = useCallback(async (): Promise<ReportTemplate[]> => {
    return handleRequest(async () => {
      const templates = await reportService.getReportTemplates();
      reportState.setTemplates(templates);
      return templates;
    });
  }, [handleRequest, reportState]);

  const createReportTemplate = useCallback(async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> => {
    return handleRequest(async () => {
      const newTemplate = await reportService.createReportTemplate(template);
      reportState.addTemplate(newTemplate);
      return newTemplate;
    });
  }, [handleRequest, reportState]);

  const updateReportTemplate = useCallback(async (id: string, template: Partial<ReportTemplate>): Promise<ReportTemplate> => {
    return handleRequest(async () => {
      const updatedTemplate = await reportService.updateReportTemplate(id, template);
      reportState.updateTemplate(id, updatedTemplate);
      return updatedTemplate;
    });
  }, [handleRequest, reportState]);

  const deleteReportTemplate = useCallback(async (id: string): Promise<void> => {
    return handleRequest(async () => {
      await reportService.deleteReportTemplate(id);
      reportState.removeTemplate(id);
    });
  }, [handleRequest, reportState]);

  // Scheduled Reports
  const getScheduledReports = useCallback(async (): Promise<ScheduledReport[]> => {
    return handleRequest(async () => {
      const reports = await reportService.getScheduledReports();
      reportState.setScheduledReports(reports);
      return reports;
    });
  }, [handleRequest, reportState]);

  const createScheduledReport = useCallback(async (report: Omit<ScheduledReport, 'id'>): Promise<ScheduledReport> => {
    return handleRequest(async () => {
      const newReport = await reportService.createScheduledReport(report);
      reportState.addScheduledReport(newReport);
      return newReport;
    });
  }, [handleRequest, reportState]);

  const updateScheduledReport = useCallback(async (id: string, report: Partial<ScheduledReport>): Promise<ScheduledReport> => {
    return handleRequest(async () => {
      const updatedReport = await reportService.updateScheduledReport(id, report);
      reportState.updateScheduledReport(id, updatedReport);
      return updatedReport;
    });
  }, [handleRequest, reportState]);

  const deleteScheduledReport = useCallback(async (id: string): Promise<void> => {
    return handleRequest(async () => {
      await reportService.deleteScheduledReport(id);
      reportState.removeScheduledReport(id);
    });
  }, [handleRequest, reportState]);

  // Utility Functions
  const generateDateRange = useCallback((range: ReportFilters['dateRange']) => {
    return reportService.generateDateRange(range);
  }, []);

  const calculateCompletionRate = useCallback((completed: number, total: number) => {
    return reportService.calculateCompletionRate(completed, total);
  }, []);

  const formatDuration = useCallback((minutes: number) => {
    return reportService.formatDuration(minutes);
  }, []);

  return {
    // State
    ...reportState,

    // Comprehensive Reports
    getReports,
    getReportMetrics,

    // Specific Report Types
    getProjectReport,
    getUserReport,
    getTaskReport,
    getTimeTrackingReport,

    // Export
    exportReport,

    // Templates
    getReportTemplates,
    createReportTemplate,
    updateReportTemplate,
    deleteReportTemplate,

    // Scheduled Reports
    getScheduledReports,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,

    // Utilities
    generateDateRange,
    calculateCompletionRate,
    formatDuration,
  };
};
