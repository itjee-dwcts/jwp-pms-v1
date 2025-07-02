import { reportService } from '@/services/report-service';
import type {
    ExportOptions,
    ProjectReport,
    ReportData,
    ReportMetrics,
    ReportTemplate,
    ScheduledReport,
    TaskReport,
    TimeTrackingReport,
    UserReport,
} from '@/types/report';
import { useCallback, useState } from 'react';

interface ReportState {
  reportData: ReportData | null;
  reportMetrics: ReportMetrics | null;
  projectReport: ProjectReport | null;
  userReport: UserReport | null;
  taskReport: TaskReport | null;
  timeTrackingReport: TimeTrackingReport | null;
  templates: ReportTemplate[];
  scheduledReports: ScheduledReport[];
  loading: boolean;
  exporting: boolean; // 추가된 상태
  error: string | null;
  exportProgress: number;
}

interface UseReportStateReturn extends ReportState {
  setReportData: (data: ReportData | null) => void;
  setReportMetrics: (metrics: ReportMetrics | null) => void;
  setProjectReport: (report: ProjectReport | null) => void;
  setUserReport: (report: UserReport | null) => void;
  setTaskReport: (report: TaskReport | null) => void;
  setTimeTrackingReport: (report: TimeTrackingReport | null) => void;
  setTemplates: (templates: ReportTemplate[]) => void;
  setScheduledReports: (reports: ScheduledReport[]) => void;
  setLoading: (loading: boolean) => void;
  setExporting: (exporting: boolean) => void; // 추가된 setter
  setError: (error: string | null) => void;
  setExportProgress: (progress: number) => void;
  clearError: () => void;
  addTemplate: (template: ReportTemplate) => void;
  updateTemplate: (id: number, updates: Partial<ReportTemplate>) => void;
  removeTemplate: (id: number) => void;
  addScheduledReport: (report: ScheduledReport) => void;
  updateScheduledReport: (id: number, updates: Partial<ScheduledReport>) => void;
  removeScheduledReport: (id: number) => void;
  exportReport: (options: ExportOptions) => Promise<void>; // 추가된 함수
  exportMultipleReports: (optionsArray: ExportOptions[]) => Promise<void>; // 추가된 함수
}

export const useReportState = (): UseReportStateReturn => {
  const [state, setState] = useState<ReportState>({
    reportData: null,
    reportMetrics: null,
    projectReport: null,
    userReport: null,
    taskReport: null,
    timeTrackingReport: null,
    templates: [],
    scheduledReports: [],
    loading: false,
    exporting: false, // 초기값 추가
    error: null,
    exportProgress: 0,
  });

  const updateState = useCallback((updates: Partial<ReportState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setReportData = useCallback((reportData: ReportData | null) => {
    updateState({ reportData });
  }, [updateState]);

  const setReportMetrics = useCallback((reportMetrics: ReportMetrics | null) => {
    updateState({ reportMetrics });
  }, [updateState]);

  const setProjectReport = useCallback((projectReport: ProjectReport | null) => {
    updateState({ projectReport });
  }, [updateState]);

  const setUserReport = useCallback((userReport: UserReport | null) => {
    updateState({ userReport });
  }, [updateState]);

  const setTaskReport = useCallback((taskReport: TaskReport | null) => {
    updateState({ taskReport });
  }, [updateState]);

  const setTimeTrackingReport = useCallback((timeTrackingReport: TimeTrackingReport | null) => {
    updateState({ timeTrackingReport });
  }, [updateState]);

  const setTemplates = useCallback((templates: ReportTemplate[]) => {
    updateState({ templates });
  }, [updateState]);

  const setScheduledReports = useCallback((scheduledReports: ScheduledReport[]) => {
    updateState({ scheduledReports });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  const setExporting = useCallback((exporting: boolean) => {
    updateState({ exporting });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  const setExportProgress = useCallback((exportProgress: number) => {
    updateState({ exportProgress });
  }, [updateState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Template 관리 함수들
  const addTemplate = useCallback((template: ReportTemplate) => {
    updateState({
      templates: [...state.templates, template]
    });
  }, [updateState, state.templates]);

  const updateTemplate = useCallback((id: number, updates: Partial<ReportTemplate>) => {
    updateState({
      templates: state.templates.map(template =>
        template.id === id ? { ...template, ...updates } : template
      )
    });
  }, [updateState, state.templates]);

  const removeTemplate = useCallback((id: number) => {
    updateState({
      templates: state.templates.filter(template => template.id !== id)
    });
  }, [updateState, state.templates]);

  // Scheduled Report 관리 함수들
  const addScheduledReport = useCallback((report: ScheduledReport) => {
    updateState({
      scheduledReports: [...state.scheduledReports, report]
    });
  }, [updateState, state.scheduledReports]);

  const updateScheduledReport = useCallback((id: number, updates: Partial<ScheduledReport>) => {
    updateState({
      scheduledReports: state.scheduledReports.map(report =>
        report.id === id ? { ...report, ...updates } : report
      )
    });
  }, [updateState, state.scheduledReports]);

  const removeScheduledReport = useCallback((id: number) => {
    updateState({
      scheduledReports: state.scheduledReports.filter(report => report.id !== id)
    });
  }, [updateState, state.scheduledReports]);

  // Export 함수들
  const exportReport = useCallback(async (options: ExportOptions): Promise<void> => {
    setExporting(true);
    setError(null);
    setExportProgress(0);

    try {
      setExportProgress(20);
      const blob = await reportService.exportReport(options);
      setExportProgress(80);

      const filename = reportService.generateFilename(options.type, options.format);
      await reportService.downloadReport(blob, filename);
      setExportProgress(100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      throw err;
    } finally {
      setExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  }, [setExporting, setError, setExportProgress]);

  const exportMultipleReports = useCallback(async (optionsArray: ExportOptions[]): Promise<void> => {
    setExporting(true);
    setError(null);
    setExportProgress(0);

    try {
      const total = optionsArray.length;
      for (let i = 0; i < total; i++) {
        const options = optionsArray[i];
        if (!options) {
          continue; // 또는 throw new Error('ExportOptions is undefined');
        }
        const blob = await reportService.exportReport(options);
        const filename = reportService.generateFilename(options.type, options.format);
        await reportService.downloadReport(blob, filename);

        setExportProgress(((i + 1) / total) * 100);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Multiple export failed';
      setError(errorMessage);
      throw err;
    } finally {
      setExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  }, [setExporting, setError, setExportProgress]);

  return {
    // 상태값들
    ...state,

    // 기본 setter들
    setReportData,
    setReportMetrics,
    setProjectReport,
    setUserReport,
    setTaskReport,
    setTimeTrackingReport,
    setTemplates,
    setScheduledReports,
    setLoading,
    setExporting,
    setError,
    setExportProgress,
    clearError,

    // Template 관리 함수들
    addTemplate,
    updateTemplate,
    removeTemplate,

    // Scheduled Report 관리 함수들
    addScheduledReport,
    updateScheduledReport,
    removeScheduledReport,

    // Export 함수들
    exportReport,
    exportMultipleReports,
  };
};
