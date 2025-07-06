import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { reportService } from '../services/report-service';
import type { ExportFormat, ExportOptions, ExportStatus } from '../types/report';

/**
 * Report Export Hook
 *
 * 리포트 내보내기 기능을 위한 전용 훅
 * reportService와 연동하여 다양한 형식으로 리포트를 내보내는 기능을 제공
 */
export const useReportExport = () => {

  /**
   * 리포트 즉시 내보내기 (동기식)
   */
  const exportReport = useCallback(async (options: ExportOptions): Promise<void> => {
    try {
      // 옵션 검증
      const validationErrors = reportService.validateExportOptions(options);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const blob = await reportService.exportReport(options);
      const filename = reportService.generateFilename(options.type, options.format);
      await reportService.downloadReport(blob, filename);

      toast.success(`Report exported as ${options.format.toUpperCase()}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export report';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  /**
   * 비동기 리포트 내보내기 시작
   */
  const startAsyncExport = useCallback(async (options: ExportOptions): Promise<string> => {
    try {
      const validationErrors = reportService.validateExportOptions(options);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const exportId = await reportService.startAsyncExport(options);
      toast.success('Export started. You will be notified when ready.');
      return exportId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start export';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  /**
   * 내보내기 상태 확인
   */
  const getExportStatus = useCallback(async (exportId: string): Promise<ExportStatus> => {
    try {
      return await reportService.getExportStatus(exportId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get export status';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  /**
   * 완료된 내보내기 다운로드
   */
  const downloadExport = useCallback(async (exportId: string): Promise<void> => {
    try {
      const status = await reportService.getExportStatus(exportId);

      if (status.status !== 'completed') {
        throw new Error(`Export is not ready. Current status: ${status.status}`);
      }

      const blob = await reportService.downloadExport(exportId);
      const filename = status.filename || `export_${exportId}.pdf`;
      await reportService.downloadReport(blob, filename);

      toast.success('Export downloaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download export';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  /**
   * 내보내기 취소
   */
  const cancelExport = useCallback(async (exportId: string): Promise<void> => {
    try {
      await reportService.cancelExport(exportId);
      toast.success('Export cancelled');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel export';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  /**
   * 내보내기 기록 조회
   */
  const getExportHistory = useCallback(async (params?: {
    page?: number;
    limit?: number;
    format?: ExportFormat;
    status?: string;
  }) => {
    try {
      return await reportService.getExportHistory(params);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get export history';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  /**
   * 빠른 내보내기 함수들 - reportService 메서드 활용
   */
  const exportOverviewReport = useCallback(async (
    format: ExportFormat = 'pdf',
    filters?: any
  ) => {
    return exportReport({
      type: 'overview',
      format,
      filters,
      include_charts: format === 'pdf',
      include_raw_data: false,
    });
  }, [exportReport]);

  const exportProjectsReport = useCallback(async (
    format: ExportFormat = 'excel',
    filters?: any
  ) => {
    return exportReport({
      type: 'projects',
      format,
      filters,
      include_charts: format === 'pdf',
      include_raw_data: format !== 'pdf',
    });
  }, [exportReport]);

  const exportTasksReport = useCallback(async (
    format: ExportFormat = 'csv',
    filters?: any
  ) => {
    return exportReport({
      type: 'tasks',
      format,
      filters,
      include_charts: false,
      include_raw_data: true,
    });
  }, [exportReport]);

  const exportUsersReport = useCallback(async (
    format: ExportFormat = 'excel',
    filters?: any
  ) => {
    return exportReport({
      type: 'users',
      format,
      filters,
      include_charts: format === 'pdf',
      include_raw_data: format !== 'pdf',
    });
  }, [exportReport]);

  /**
   * 유틸리티 함수들 - reportService 위임
   */
  const getSupportedFormats = useCallback((reportType: string): ExportFormat[] => {
    return reportService.getSupportedFormats(reportType) as ExportFormat[];
  }, []);

  const validateExportOptions = useCallback((options: ExportOptions): string[] => {
    return reportService.validateExportOptions(options);
  }, []);

  const estimateFileSize = useCallback((options: ExportOptions): string => {
    return reportService.estimateFileSize(options);
  }, []);

  const generateFilename = useCallback((options: ExportOptions): string => {
    return reportService.generateFilename(options.type, options.format);
  }, []);

  /**
   * 대량 내보내기 (여러 리포트를 한 번에)
   */
  const exportMultipleReports = useCallback(async (
    optionsArray: ExportOptions[]
  ): Promise<void> => {
    try {
      // 모든 옵션 검증
      for (const options of optionsArray) {
        const validationErrors = reportService.validateExportOptions(options);
        if (validationErrors.length > 0) {
          throw new Error(`Invalid options for ${options.type}: ${validationErrors.join(', ')}`);
        }
      }

      // 순차적으로 내보내기 실행
      for (const options of optionsArray) {
        const blob = await reportService.exportReport(options);
        const filename = reportService.generateFilename(options.type, options.format);
        await reportService.downloadReport(blob, filename);
      }

      toast.success(`Successfully exported ${optionsArray.length} reports`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export multiple reports';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  /**
   * 특정 날짜 범위의 모든 리포트 내보내기
   */
  const exportAllReports = useCallback(async (
    format: ExportFormat,
    filters: any
  ): Promise<void> => {
    // Ensure reportTypes is typed as ReportType[]
    const reportTypes: import('@/types/report').ReportType[] = ['overview', 'projects', 'tasks', 'users'];
    const optionsArray: ExportOptions[] = reportTypes.map(type => ({
      type,
      format,
      filters,
      include_charts: format === 'pdf',
      include_raw_data: format !== 'pdf',
    }));

    return exportMultipleReports(optionsArray);
  }, [exportMultipleReports]);

  return {
    // 핵심 내보내기 함수들
    exportReport,
    startAsyncExport,
    getExportStatus,
    downloadExport,
    cancelExport,
    getExportHistory,

    // 빠른 내보내기 함수들
    exportOverviewReport,
    exportProjectsReport,
    exportTasksReport,
    exportUsersReport,

    // 대량 내보내기 함수들
    exportMultipleReports,
    exportAllReports,

    // 유틸리티 함수들 (reportService 위임)
    getSupportedFormats,
    validateExportOptions,
    estimateFileSize,
    generateFilename,
  };
};

export default useReportExport;
