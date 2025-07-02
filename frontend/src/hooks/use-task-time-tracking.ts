import { taskService } from '@/services/task-service';
import type { TaskTimeLog, TimeLogCreateRequest } from '@/types/task';
import { useCallback, useState } from 'react';

interface UseTaskTimeTrackingReturn {
  timeLogs: TaskTimeLog[];
  loading: boolean;
  error: string | null;
  getTimeLogs: (taskId: number) => Promise<TaskTimeLog[]>;
  addTimeLog: (taskId: number, data: TimeLogCreateRequest) => Promise<TaskTimeLog>;
  updateTimeLog: (taskId: number, timeLogId: number, data: Partial<TimeLogCreateRequest>) => Promise<TaskTimeLog>;
  deleteTimeLog: (taskId: number, timeLogId: number) => Promise<void>;
  getTotalHours: () => number;
  clearError: () => void;
}

export const useTaskTimeTracking = (): UseTaskTimeTrackingReturn => {
  const [timeLogs, setTimeLogs] = useState<TaskTimeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await request();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTimeLogs = useCallback(async (taskId: number): Promise<TaskTimeLog[]> => {
    return handleRequest(async () => {
      const logs = await taskService.getTaskTimeLogs(taskId);
      setTimeLogs(logs);
      return logs;
    });
  }, [handleRequest]);

  const addTimeLog = useCallback(async (taskId: number, data: TimeLogCreateRequest): Promise<TaskTimeLog> => {
    return handleRequest(async () => {
      const timeLog = await taskService.addTimeLog(taskId, data);
      setTimeLogs(prev => [...prev, timeLog]);
      return timeLog;
    });
  }, [handleRequest]);

  const updateTimeLog = useCallback(async (
    taskId: number,
    timeLogId: number,
    data: Partial<TimeLogCreateRequest>
  ): Promise<TaskTimeLog> => {
    return handleRequest(async () => {
      const timeLog = await taskService.updateTimeLog(taskId, timeLogId, data);
      setTimeLogs(prev => prev.map(log => log.id === timeLogId ? timeLog : log));
      return timeLog;
    });
  }, [handleRequest]);

  const deleteTimeLog = useCallback(async (taskId: number, timeLogId: number): Promise<void> => {
    return handleRequest(async () => {
      await taskService.deleteTimeLog(taskId, timeLogId);
      setTimeLogs(prev => prev.filter(log => log.id !== timeLogId));
    });
  }, [handleRequest]);

  const getTotalHours = useCallback((): number => {
    return timeLogs.reduce((total, log) => total + log.hours, 0);
  }, [timeLogs]);

  return {
    timeLogs,
    loading,
    error,
    getTimeLogs,
    addTimeLog,
    updateTimeLog,
    deleteTimeLog,
    getTotalHours,
    clearError,
  };
};
