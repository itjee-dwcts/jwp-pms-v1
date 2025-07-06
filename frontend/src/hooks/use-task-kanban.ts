import { useCallback, useState } from 'react';
import { taskService } from '../services/task-service';
import type { Task, TaskKanbanBoard } from '../types/task';

interface UseTaskKanbanReturn {
  kanbanBoard: TaskKanbanBoard | null;
  loading: boolean;
  error: string | null;
  getKanbanBoard: (projectId?: string) => Promise<TaskKanbanBoard>;
  moveTask: (taskId: string, newStatus: string) => Promise<Task>;
  clearError: () => void;
}

export const useTaskKanban = (): UseTaskKanbanReturn => {
  const [kanbanBoard, setKanbanBoard] = useState<TaskKanbanBoard | null>(null);
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

  const getKanbanBoard = useCallback(async (projectId?: string): Promise<TaskKanbanBoard> => {
    return handleRequest(async () => {
      const board = await taskService.getKanbanBoard(projectId);
      setKanbanBoard(board);
      return board;
    });
  }, [handleRequest]);

  const moveTask = useCallback(async (taskId: string, newStatus: string): Promise<Task> => {
    return handleRequest(async () => {
      const task = await taskService.updateTaskStatus(taskId, newStatus);

      // Update local kanban board state
      if (kanbanBoard) {
        const updatedBoard = { ...kanbanBoard };

        // Remove task from old column
        updatedBoard.columns = updatedBoard.columns.map(column => ({
          ...column,
          tasks: column.tasks.filter(t => t.id !== taskId),
          task_count: column.tasks.filter(t => t.id !== taskId).length,
        }));

        // Add task to new column
        const newColumn = updatedBoard.columns.find(col => col.status === newStatus);
        if (newColumn) {
          newColumn.tasks.push(task);
          newColumn.task_count += 1;
        }

        setKanbanBoard(updatedBoard);
      }

      return task;
    });
  }, [handleRequest, kanbanBoard]);

  return {
    kanbanBoard,
    loading,
    error,
    getKanbanBoard,
    moveTask,
    clearError,
  };
};
