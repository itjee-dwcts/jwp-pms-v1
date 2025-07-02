import { taskService } from '@/services/task-service';
import type {
  AssignTaskRequest,
  BulkTaskAssignRequest,
  BulkTaskDeleteRequest,
  BulkTaskUpdateRequest,
  CommentCreateRequest,
  CommentUpdateRequest,
  DependencyCreateRequest,
  TagCreateRequest,
  Task,
  TaskAssignee,
  TaskAttachment,
  TaskComment,
  TaskCreateRequest,
  TaskDependency,
  TaskDuplicateOptions,
  TaskGanttChart,
  TaskKanbanBoard,
  TaskPriority,
  TaskSearchParams,
  TaskStatsResponse,
  TaskStatus,
  TaskTag,
  TaskTimeLog,
  TimeLogCreateRequest
} from '@/types/task';
import { useCallback } from 'react';
import { useTaskState } from './use-task-state';

export const useTasks = () => {
  const taskState = useTaskState();

  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<T> => {
    taskState.setLoading(true);
    taskState.setError(null);
    try {
      const result = await request();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      taskState.setError(errorMessage);
      throw err;
    } finally {
      taskState.setLoading(false);
    }
  }, [taskState]);

  // CRUD Operations
  const getTasks = useCallback(async (params?: TaskSearchParams): Promise<Task[]> => {
    return handleRequest(async () => {
      const tasks = await taskService.getTasks(params);
      taskState.setTasks(tasks);
      return tasks;
    });
  }, [handleRequest, taskState]);

  const getTask = useCallback(async (id: number): Promise<Task> => {
    return handleRequest(async () => {
      const task = await taskService.getTask(id);
      taskState.setCurrentTask(task);
      return task;
    });
  }, [handleRequest, taskState]);

  const createTask = useCallback(async (data: TaskCreateRequest): Promise<Task> => {
    return handleRequest(async () => {
      const task = await taskService.createTask(data);
      taskState.addTask(task);
      return task;
    });
  }, [handleRequest, taskState]);

  const updateTask = useCallback(async (id: number, data: Partial<TaskCreateRequest>): Promise<Task> => {
    return handleRequest(async () => {
      const task = await taskService.updateTask(id, data);
      taskState.updateTaskInList(id, task);
      if (taskState.currentTask?.id === id) {
        taskState.setCurrentTask(task);
      }
      return task;
    });
  }, [handleRequest, taskState]);

  const deleteTask = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await taskService.deleteTask(id);
      taskState.removeTask(id);
      if (taskState.currentTask?.id === id) {
        taskState.setCurrentTask(null);
      }
    });
  }, [handleRequest, taskState]);

  // Statistics
  const getTaskStats = useCallback(async (params?: TaskSearchParams): Promise<TaskStatsResponse> => {
    return handleRequest(() => taskService.getTaskStats(params));
  }, [handleRequest]);

  // Kanban Board
  const getKanbanBoard = useCallback(async (projectId?: number): Promise<TaskKanbanBoard> => {
    return handleRequest(async () => {
      const board = await taskService.getKanbanBoard(projectId);
      taskState.setKanbanBoard(board);
      return board;
    });
  }, [handleRequest, taskState]);

  const updateTaskStatus = useCallback(async (id: number, status: TaskStatus): Promise<Task> => {
    return handleRequest(async () => {
      const task = await taskService.updateTaskStatus(id, status);
      taskState.updateTaskInList(id, task);
      return task;
    });
  }, [handleRequest, taskState]);

  // Gantt Chart
  const getGanttChart = useCallback(async (projectId?: number): Promise<TaskGanttChart> => {
    return handleRequest(() => taskService.getGanttChart(projectId));
  }, [handleRequest]);

  // Task Assignments
  const getTaskAssignees = useCallback(async (taskId: number): Promise<TaskAssignee[]> => {
    return handleRequest(async () => {
      const assignees = await taskService.getTaskAssignees(taskId);
      taskState.setTaskAssignees(assignees);
      return assignees;
    });
  }, [handleRequest, taskState]);

  const assignTask = useCallback(async (taskId: number, data: AssignTaskRequest): Promise<TaskAssignee[]> => {
    return handleRequest(async () => {
      const assignees = await taskService.assignTask(taskId, data);
      taskState.setTaskAssignees(assignees);
      return assignees;
    });
  }, [handleRequest, taskState]);

  const unassignTask = useCallback(async (taskId: number, userId: number): Promise<void> => {
    return handleRequest(async () => {
      await taskService.unassignTask(taskId, userId);
      taskState.removeAssignee(userId);
    });
  }, [handleRequest, taskState]);

  // Task Comments
  const getTaskComments = useCallback(async (taskId: number): Promise<TaskComment[]> => {
    return handleRequest(async () => {
      const comments = await taskService.getTaskComments(taskId);
      taskState.setTaskComments(comments);
      return comments;
    });
  }, [handleRequest, taskState]);

  const addTaskComment = useCallback(async (
    taskId: number,
    data: CommentCreateRequest
  ): Promise<TaskComment> => {
    return handleRequest(async () => {
      const comment = await taskService.addTaskComment(taskId, data);
      taskState.addComment(comment);
      return comment;
    });
  }, [handleRequest, taskState]);

  const updateTaskComment = useCallback(async (
    taskId: number,
    commentId: number,
    data: CommentUpdateRequest
  ): Promise<TaskComment> => {
    return handleRequest(async () => {
      const comment = await taskService.updateTaskComment(taskId, commentId, data);
      taskState.updateComment(commentId, comment);
      return comment;
    });
  }, [handleRequest, taskState]);

  const deleteTaskComment = useCallback(async (taskId: number, commentId: number): Promise<void> => {
    return handleRequest(async () => {
      await taskService.deleteTaskComment(taskId, commentId);
      taskState.removeComment(commentId);
    });
  }, [handleRequest, taskState]);

  // Task Attachments
  const getTaskAttachments = useCallback(async (taskId: number): Promise<TaskAttachment[]> => {
    return handleRequest(async () => {
      const attachments = await taskService.getTaskAttachments(taskId);
      taskState.setTaskAttachments(attachments);
      return attachments;
    });
  }, [handleRequest, taskState]);

  const uploadTaskFile = useCallback(async (taskId: number, file: File): Promise<TaskAttachment> => {
    return handleRequest(async () => {
      const attachment = await taskService.uploadTaskFile(taskId, file);
      taskState.addAttachment(attachment);
      return attachment;
    });
  }, [handleRequest, taskState]);

  const deleteTaskAttachment = useCallback(async (taskId: number, attachmentId: number): Promise<void> => {
    return handleRequest(async () => {
      await taskService.deleteTaskAttachment(taskId, attachmentId);
      taskState.removeAttachment(attachmentId);
    });
  }, [handleRequest, taskState]);

  // Task Time Logs
  const getTaskTimeLogs = useCallback(async (taskId: number): Promise<TaskTimeLog[]> => {
    return handleRequest(async () => {
      const timeLogs = await taskService.getTaskTimeLogs(taskId);
      taskState.setTaskTimeLogs(timeLogs);
      return timeLogs;
    });
  }, [handleRequest, taskState]);

  const addTimeLog = useCallback(async (
    taskId: number,
    data: TimeLogCreateRequest
  ): Promise<TaskTimeLog> => {
    return handleRequest(async () => {
      const timeLog = await taskService.addTimeLog(taskId, data);
      taskState.addTimeLog(timeLog);
      return timeLog;
    });
  }, [handleRequest, taskState]);

  const updateTimeLog = useCallback(async (
    taskId: number,
    timeLogId: number,
    data: Partial<TimeLogCreateRequest>
  ): Promise<TaskTimeLog> => {
    return handleRequest(async () => {
      const timeLog = await taskService.updateTimeLog(taskId, timeLogId, data);
      taskState.updateTimeLog(timeLogId, timeLog);
      return timeLog;
    });
  }, [handleRequest, taskState]);

  const deleteTimeLog = useCallback(async (taskId: number, timeLogId: number): Promise<void> => {
    return handleRequest(async () => {
      await taskService.deleteTimeLog(taskId, timeLogId);
      taskState.removeTimeLog(timeLogId);
    });
  }, [handleRequest, taskState]);

  // Task Tags
  const getTags = useCallback(async (): Promise<TaskTag[]> => {
    return handleRequest(async () => {
      const tags = await taskService.getTags();
      taskState.setTaskTags(tags);
      return tags;
    });
  }, [handleRequest, taskState]);

  const createTag = useCallback(async (data: TagCreateRequest): Promise<TaskTag> => {
    return handleRequest(async () => {
      const tag = await taskService.createTag(data);
      taskState.addTag(tag);
      return tag;
    });
  }, [handleRequest, taskState]);

  const addTaskTags = useCallback(async (taskId: number, tagIds: number[]): Promise<TaskTag[]> => {
    return handleRequest(() => taskService.addTaskTags(taskId, tagIds));
  }, [handleRequest]);

  const removeTaskTag = useCallback(async (taskId: number, tagId: number): Promise<void> => {
    return handleRequest(async () => {
      await taskService.removeTaskTag(taskId, tagId);
      taskState.removeTag(tagId);
    });
  }, [handleRequest, taskState]);

  // Task Dependencies
  const getTaskDependencies = useCallback(async (taskId: number): Promise<TaskDependency[]> => {
    return handleRequest(async () => {
      const dependencies = await taskService.getTaskDependencies(taskId);
      taskState.setTaskDependencies(dependencies);
      return dependencies;
    });
  }, [handleRequest, taskState]);

  const addTaskDependency = useCallback(async (
    taskId: number,
    data: DependencyCreateRequest
  ): Promise<TaskDependency> => {
    return handleRequest(async () => {
      const dependency = await taskService.addTaskDependency(taskId, data);
      taskState.addDependency(dependency);
      return dependency;
    });
  }, [handleRequest, taskState]);

  const removeTaskDependency = useCallback(async (taskId: number, dependencyId: number): Promise<void> => {
    return handleRequest(async () => {
      await taskService.removeTaskDependency(taskId, dependencyId);
      taskState.removeDependency(dependencyId);
    });
  }, [handleRequest, taskState]);

  // Advanced Operations
  const duplicateTask = useCallback(async (id: number, options?: TaskDuplicateOptions): Promise<Task> => {
    return handleRequest(async () => {
      const task = await taskService.duplicateTask(id, options);
      taskState.addTask(task);
      return task;
    });
  }, [handleRequest, taskState]);

  // Bulk Operations
  const bulkUpdateTasks = useCallback(async (data: BulkTaskUpdateRequest): Promise<Task[]> => {
    return handleRequest(async () => {
      const tasks = await taskService.bulkUpdateTasks(data);
      tasks.forEach(task => {
        taskState.updateTaskInList(task.id, task);
      });
      return tasks;
    });
  }, [handleRequest, taskState]);

  const bulkDeleteTasks = useCallback(async (data: BulkTaskDeleteRequest): Promise<void> => {
    return handleRequest(async () => {
      await taskService.bulkDeleteTasks(data);
      data.ids.forEach(id => {
        taskState.removeTask(id);
      });
    });
  }, [handleRequest, taskState]);

  const bulkAssignTasks = useCallback(async (data: BulkTaskAssignRequest): Promise<void> => {
    return handleRequest(() => taskService.bulkAssignTasks(data));
  }, [handleRequest]);

  // Search
  const searchTasks = useCallback(async (query: string, filters?: {
    project_id?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: number;
    page_size?: number;
  }): Promise<Task[]> => {
    return handleRequest(async () => {
      const tasks = await taskService.searchTasks(query, filters);
      taskState.setTasks(tasks);
      return tasks;
    });
  }, [handleRequest, taskState]);

  // Export
  const exportTasks = useCallback(async (
    format: 'csv' | 'xlsx' | 'json',
    filters?: TaskSearchParams
  ): Promise<Blob> => {
    return handleRequest(() => taskService.exportTasks(format, filters));
  }, [handleRequest]);

  return {
    // State
    ...taskState,

    // CRUD Operations
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,

    // Statistics
    getTaskStats,

    // Kanban & Gantt
    getKanbanBoard,
    updateTaskStatus,
    getGanttChart,

    // Assignments
    getTaskAssignees,
    assignTask,
    unassignTask,

    // Comments
    getTaskComments,
    addTaskComment,
    updateTaskComment,
    deleteTaskComment,

    // Attachments
    getTaskAttachments,
    uploadTaskFile,
    deleteTaskAttachment,

    // Time Logs
    getTaskTimeLogs,
    addTimeLog,
    updateTimeLog,
    deleteTimeLog,

    // Tags
    getTags,
    createTag,
    addTaskTags,
    removeTaskTag,

    // Dependencies
    getTaskDependencies,
    addTaskDependency,
    removeTaskDependency,

    // Advanced Operations
    duplicateTask,

    // Bulk Operations
    bulkUpdateTasks,
    bulkDeleteTasks,
    bulkAssignTasks,

    // Search & Export
    searchTasks,
    exportTasks,
  };
};
