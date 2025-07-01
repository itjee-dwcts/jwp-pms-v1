import { useState, useCallback } from 'react';
import { apiClient } from './useAuth';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'task' | 'bug' | 'feature' | 'improvement' | 'research';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
  project: {
    id: number;
    name: string;
  };
  assignees: TaskAssignee[];
  creator: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  parent_task?: {
    id: number;
    title: string;
  };
  subtasks?: Task[];
  tags: TaskTag[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  time_logs?: TaskTimeLog[];
  dependencies?: TaskDependency[];
  comments_count: number;
  attachments_count: number;
  subtasks_count: number;
}

export interface TaskAssignee {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  assigned_at: string;
  assigned_by: number;
}

export interface TaskTag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskComment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  parent_id?: number;
  replies?: TaskComment[];
}

export interface TaskAttachment {
  id: number;
  file_name: string;
  file_size: number;
  file_path: string;
  mime_type: string;
  uploaded_at: string;
  uploader: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface TaskTimeLog {
  id: number;
  hours: number;
  description?: string;
  work_date: string;
  created_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface TaskDependency {
  id: number;
  dependent_task_id: number;
  dependency_task_id: number;
  dependency_type: 'blocks' | 'blocked_by' | 'relates_to';
  created_at: string;
  dependency_task: {
    id: number;
    title: string;
    status: TaskStatus;
  };
}

export interface TaskCreateRequest {
  title: string;
  description: string;
  project_id: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  due_date?: string;
  estimated_hours?: number;
  parent_task_id?: number;
  assignee_ids?: number[];
  tag_ids?: number[];
  dependency_ids?: number[];
}

export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {
  id: number;
}

export interface TaskSearchParams {
  search?: string;
  project_id?: number;
  assignee_id?: number;
  creator_id?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  due_before?: string;
  due_after?: string;
  created_before?: string;
  created_after?: string;
  tag_ids?: number[];
  has_due_date?: boolean;
  is_overdue?: boolean;
  parent_task_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TaskStatsResponse {
  total_tasks: number;
  by_status: Record<TaskStatus, number>;
  by_priority: Record<TaskPriority, number>;
  by_type: Record<TaskType, number>;
  completion_rate: number;
  overdue_tasks: number;
  average_completion_time: number;
  tasks_this_week: number;
  tasks_this_month: number;
}

export interface TaskKanbanBoard {
  columns: TaskKanbanColumn[];
  total_tasks: number;
}

export interface TaskKanbanColumn {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  task_count: number;
}

export interface TaskGanttChart {
  tasks: TaskGanttItem[];
  dependencies: TaskDependency[];
  timeline: {
    start_date: string;
    end_date: string;
  };
}

export interface TaskGanttItem {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  parent_id?: number;
}

export interface CommentCreateRequest {
  content: string;
  parent_id?: number;
}

export interface CommentUpdateRequest {
  content: string;
}

export interface TimeLogCreateRequest {
  hours: number;
  description?: string;
  work_date: string;
}

export interface TimeLogUpdateRequest extends Partial<TimeLogCreateRequest> {
  id: number;
}

export interface AssignTaskRequest {
  user_ids: number[];
}

export interface TagCreateRequest {
  name: string;
  color: string;
}

export interface DependencyCreateRequest {
  dependency_task_id: number;
  dependency_type: 'blocks' | 'blocked_by' | 'relates_to';
}

export const useTasks = () => {
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

  // Task CRUD operations
  const getTasks = useCallback(async (params?: TaskSearchParams): Promise<Task[]> => {
    return handleRequest(async () => {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await apiClient.request<TaskListResponse>(
        `/tasks?${queryParams.toString()}`
      );
      return response.tasks;
    });
  }, [handleRequest]);

  const getTask = useCallback(async (id: number): Promise<Task> => {
    return handleRequest(async () => {
      return apiClient.request<Task>(`/tasks/${id}`);
    });
  }, [handleRequest]);

  const createTask = useCallback(async (data: TaskCreateRequest): Promise<Task> => {
    return handleRequest(async () => {
      return apiClient.request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const updateTask = useCallback(async (id: number, data: Partial<TaskCreateRequest>): Promise<Task> => {
    return handleRequest(async () => {
      return apiClient.request<Task>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const deleteTask = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/tasks/${id}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Task statistics
  const getTaskStats = useCallback(async (params?: TaskSearchParams): Promise<TaskStatsResponse> => {
    return handleRequest(async () => {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      return apiClient.request<TaskStatsResponse>(
        `/tasks/stats?${queryParams.toString()}`
      );
    });
  }, [handleRequest]);

  // Kanban board
  const getKanbanBoard = useCallback(async (projectId?: number): Promise<TaskKanbanBoard> => {
    return handleRequest(async () => {
      const params = projectId ? `?project_id=${projectId}` : '';
      return apiClient.request<TaskKanbanBoard>(`/tasks/kanban${params}`);
    });
  }, [handleRequest]);

  const updateTaskStatus = useCallback(async (id: number, status: TaskStatus): Promise<Task> => {
    return handleRequest(async () => {
      return apiClient.request<Task>(`/tasks/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    });
  }, [handleRequest]);

  // Gantt chart
  const getGanttChart = useCallback(async (projectId?: number): Promise<TaskGanttChart> => {
    return handleRequest(async () => {
      const params = projectId ? `?project_id=${projectId}` : '';
      return apiClient.request<TaskGanttChart>(`/tasks/gantt${params}`);
    });
  }, [handleRequest]);

  // Task assignments
  const getTaskAssignees = useCallback(async (taskId: number): Promise<TaskAssignee[]> => {
    return handleRequest(async () => {
      return apiClient.request<TaskAssignee[]>(`/tasks/${taskId}/assignees`);
    });
  }, [handleRequest]);

  const assignTask = useCallback(async (taskId: number, data: AssignTaskRequest): Promise<TaskAssignee[]> => {
    return handleRequest(async () => {
      return apiClient.request<TaskAssignee[]>(`/tasks/${taskId}/assign`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const unassignTask = useCallback(async (taskId: number, userId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/tasks/${taskId}/assignees/${userId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Task comments
  const getTaskComments = useCallback(async (taskId: number): Promise<TaskComment[]> => {
    return handleRequest(async () => {
      return apiClient.request<TaskComment[]>(`/tasks/${taskId}/comments`);
    });
  }, [handleRequest]);

  const addTaskComment = useCallback(async (
    taskId: number,
    data: CommentCreateRequest
  ): Promise<TaskComment> => {
    return handleRequest(async () => {
      return apiClient.request<TaskComment>(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const updateTaskComment = useCallback(async (
    taskId: number,
    commentId: number,
    data: CommentUpdateRequest
  ): Promise<TaskComment> => {
    return handleRequest(async () => {
      return apiClient.request<TaskComment>(`/tasks/${taskId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const deleteTaskComment = useCallback(async (taskId: number, commentId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Task attachments
  const getTaskAttachments = useCallback(async (taskId: number): Promise<TaskAttachment[]> => {
    return handleRequest(async () => {
      return apiClient.request<TaskAttachment[]>(`/tasks/${taskId}/attachments`);
    });
  }, [handleRequest]);

  const uploadTaskFile = useCallback(async (taskId: number, file: File): Promise<TaskAttachment> => {
    return handleRequest(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiClient['baseUrl']}/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pms_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      return response.json();
    });
  }, [handleRequest]);

  const deleteTaskAttachment = useCallback(async (taskId: number, attachmentId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Task time logs
  const getTaskTimeLogs = useCallback(async (taskId: number): Promise<TaskTimeLog[]> => {
    return handleRequest(async () => {
      return apiClient.request<TaskTimeLog[]>(`/tasks/${taskId}/time-logs`);
    });
  }, [handleRequest]);

  const addTimeLog = useCallback(async (
    taskId: number,
    data: TimeLogCreateRequest
  ): Promise<TaskTimeLog> => {
    return handleRequest(async () => {
      return apiClient.request<TaskTimeLog>(`/tasks/${taskId}/time-logs`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const updateTimeLog = useCallback(async (
    taskId: number,
    timeLogId: number,
    data: Partial<TimeLogCreateRequest>
  ): Promise<TaskTimeLog> => {
    return handleRequest(async () => {
      return apiClient.request<TaskTimeLog>(`/tasks/${taskId}/time-logs/${timeLogId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const deleteTimeLog = useCallback(async (taskId: number, timeLogId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/tasks/${taskId}/time-logs/${timeLogId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Task tags
  const getTags = useCallback(async (): Promise<TaskTag[]> => {
    return handleRequest(async () => {
      return apiClient.request<TaskTag[]>('/tasks/tags');
    });
  }, [handleRequest]);

  const createTag = useCallback(async (data: TagCreateRequest): Promise<TaskTag> => {
    return handleRequest(async () => {
      return apiClient.request<TaskTag>('/tasks/tags', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const addTaskTags = useCallback(async (taskId: number, tagIds: number[]): Promise<TaskTag[]> => {
    return handleRequest(async () => {
      return apiClient.request<TaskTag[]>(`/tasks/${taskId}/tags`, {
        method: 'POST',
        body: JSON.stringify({ tag_ids: tagIds }),
      });
    });
  }, [handleRequest]);

  const removeTaskTag = useCallback(async (taskId: number, tagId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/tasks/${taskId}/tags/${tagId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Task dependencies
  const getTaskDependencies = useCallback(async (taskId: number): Promise<TaskDependency[]> => {
    return handleRequest(async () => {
      return apiClient.request<TaskDependency[]>(`/tasks/${taskId}/dependencies`);
    });
  }, [handleRequest]);

  const addTaskDependency = useCallback(async (
    taskId: number,
    data: DependencyCreateRequest
  ): Promise<TaskDependency> => {
    return handleRequest(async () => {
      return apiClient.request<TaskDependency>(`/tasks/${taskId}/dependencies`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const removeTaskDependency = useCallback(async (taskId: number, dependencyId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/tasks/${taskId}/dependencies/${dependencyId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Task duplication
  const duplicateTask = useCallback(async (
    id: number,
    options?: {
      include_assignees?: boolean;
      include_comments?: boolean;
      include_attachments?: boolean;
      include_time_logs?: boolean;
    }
  ): Promise<Task> => {
    return handleRequest(async () => {
      return apiClient.request<Task>(`/tasks/${id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify(options || {}),
      });
    });
  }, [handleRequest]);

  // Bulk operations
  const bulkUpdateTasks = useCallback(async (
    ids: number[],
    updates: Partial<TaskCreateRequest>
  ): Promise<Task[]> => {
    return handleRequest(async () => {
      return apiClient.request<Task[]>('/tasks/bulk-update', {
        method: 'PUT',
        body: JSON.stringify({ ids, updates }),
      });
    });
  }, [handleRequest]);

  const bulkDeleteTasks = useCallback(async (ids: number[]): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request('/tasks/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      });
    });
  }, [handleRequest]);

  const bulkAssignTasks = useCallback(async (
    taskIds: number[],
    userIds: number[]
  ): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request('/tasks/bulk-assign', {
        method: 'POST',
        body: JSON.stringify({ task_ids: taskIds, user_ids: userIds }),
      });
    });
  }, [handleRequest]);

  // Task search and filtering
  const searchTasks = useCallback(async (query: string, filters?: {
    project_id?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: number;
    limit?: number;
  }): Promise<Task[]> => {
    return handleRequest(async () => {
      const params = new URLSearchParams({ search: query });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.request<TaskListResponse>(
        `/tasks/search?${params.toString()}`
      );
      return response.tasks;
    });
  }, [handleRequest]);

  return {
    // State
    loading,
    error,
    clearError,

    // Task CRUD
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,

    // Statistics
    getTaskStats,

    // Kanban and Gantt
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

    // Time logs
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

    // Advanced operations
    duplicateTask,

    // Bulk operations
    bulkUpdateTasks,
    bulkDeleteTasks,
    bulkAssignTasks,

    // Search
    searchTasks,
  };
};

export default useTasks;
