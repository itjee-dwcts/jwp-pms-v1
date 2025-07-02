import { apiClient } from '@/services/api-client';
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
    TaskListResponse,
    TaskSearchParams,
    TaskStatsResponse,
    TaskStatus,
    TaskTag,
    TaskTimeLog,
    TimeLogCreateRequest
} from '@/types/task';
import { buildQueryParams } from '@/utils/query-params';

export class TaskService {
  // CRUD Operations
  async getTasks(params?: TaskSearchParams): Promise<Task[]> {
    const queryString = params ? buildQueryParams(params) : '';
    const response = await apiClient.request<TaskListResponse>(
      `/tasks${queryString ? `?${queryString}` : ''}`
    );
    return response.tasks;
  }

  async getTask(id: number): Promise<Task> {
    return apiClient.request<Task>(`/tasks/${id}`);
  }

  async createTask(data: TaskCreateRequest): Promise<Task> {
    return apiClient.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: number, data: Partial<TaskCreateRequest>): Promise<Task> {
    return apiClient.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: number): Promise<void> {
    await apiClient.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getTaskStats(params?: TaskSearchParams): Promise<TaskStatsResponse> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<TaskStatsResponse>(
      `/tasks/stats${queryString ? `?${queryString}` : ''}`
    );
  }

  // Kanban Board
  async getKanbanBoard(projectId?: number): Promise<TaskKanbanBoard> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return apiClient.request<TaskKanbanBoard>(`/tasks/kanban${params}`);
  }

  async updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
    return apiClient.request<Task>(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Gantt Chart
  async getGanttChart(projectId?: number): Promise<TaskGanttChart> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return apiClient.request<TaskGanttChart>(`/tasks/gantt${params}`);
  }

  // Task Assignments
  async getTaskAssignees(taskId: number): Promise<TaskAssignee[]> {
    return apiClient.request<TaskAssignee[]>(`/tasks/${taskId}/assignees`);
  }

  async assignTask(taskId: number, data: AssignTaskRequest): Promise<TaskAssignee[]> {
    return apiClient.request<TaskAssignee[]>(`/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unassignTask(taskId: number, userId: number): Promise<void> {
    await apiClient.request(`/tasks/${taskId}/assignees/${userId}`, {
      method: 'DELETE',
    });
  }

  // Task Comments
  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return apiClient.request<TaskComment[]>(`/tasks/${taskId}/comments`);
  }

  async addTaskComment(taskId: number, data: CommentCreateRequest): Promise<TaskComment> {
    return apiClient.request<TaskComment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTaskComment(
    taskId: number,
    commentId: number,
    data: CommentUpdateRequest
  ): Promise<TaskComment> {
    return apiClient.request<TaskComment>(`/tasks/${taskId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTaskComment(taskId: number, commentId: number): Promise<void> {
    await apiClient.request(`/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Task Attachments
  async getTaskAttachments(taskId: number): Promise<TaskAttachment[]> {
    return apiClient.request<TaskAttachment[]>(`/tasks/${taskId}/attachments`);
  }

  async uploadTaskFile(taskId: number, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiClient.baseUrl}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'File upload failed');
    }

    return response.json();
  }

  async deleteTaskAttachment(taskId: number, attachmentId: number): Promise<void> {
    await apiClient.request(`/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // Task Time Logs
  async getTaskTimeLogs(taskId: number): Promise<TaskTimeLog[]> {
    return apiClient.request<TaskTimeLog[]>(`/tasks/${taskId}/time-logs`);
  }

  async addTimeLog(taskId: number, data: TimeLogCreateRequest): Promise<TaskTimeLog> {
    return apiClient.request<TaskTimeLog>(`/tasks/${taskId}/time-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTimeLog(
    taskId: number,
    timeLogId: number,
    data: Partial<TimeLogCreateRequest>
  ): Promise<TaskTimeLog> {
    return apiClient.request<TaskTimeLog>(`/tasks/${taskId}/time-logs/${timeLogId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTimeLog(taskId: number, timeLogId: number): Promise<void> {
    await apiClient.request(`/tasks/${taskId}/time-logs/${timeLogId}`, {
      method: 'DELETE',
    });
  }

  // Task Tags
  async getTags(): Promise<TaskTag[]> {
    return apiClient.request<TaskTag[]>('/tasks/tags');
  }

  async createTag(data: TagCreateRequest): Promise<TaskTag> {
    return apiClient.request<TaskTag>('/tasks/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addTaskTags(taskId: number, tagIds: number[]): Promise<TaskTag[]> {
    return apiClient.request<TaskTag[]>(`/tasks/${taskId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_ids: tagIds }),
    });
  }

  async removeTaskTag(taskId: number, tagId: number): Promise<void> {
    await apiClient.request(`/tasks/${taskId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  }

  // Task Dependencies
  async getTaskDependencies(taskId: number): Promise<TaskDependency[]> {
    return apiClient.request<TaskDependency[]>(`/tasks/${taskId}/dependencies`);
  }

  async addTaskDependency(taskId: number, data: DependencyCreateRequest): Promise<TaskDependency> {
    return apiClient.request<TaskDependency>(`/tasks/${taskId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeTaskDependency(taskId: number, dependencyId: number): Promise<void> {
    await apiClient.request(`/tasks/${taskId}/dependencies/${dependencyId}`, {
      method: 'DELETE',
    });
  }

  // Advanced Operations
  async duplicateTask(id: number, options?: TaskDuplicateOptions): Promise<Task> {
    return apiClient.request<Task>(`/tasks/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  // Bulk Operations
  async bulkUpdateTasks(data: BulkTaskUpdateRequest): Promise<Task[]> {
    return apiClient.request<Task[]>('/tasks/bulk-update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async bulkDeleteTasks(data: BulkTaskDeleteRequest): Promise<void> {
    await apiClient.request('/tasks/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  async bulkAssignTasks(data: BulkTaskAssignRequest): Promise<void> {
    await apiClient.request('/tasks/bulk-assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Search & Filter
  async searchTasks(query: string, filters?: {
    project_id?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: number;
    page_size?: number;
  }): Promise<Task[]> {
    const params = { search: query, ...filters };
    const queryString = buildQueryParams(params);

    const response = await apiClient.request<TaskListResponse>(
      `/tasks/search?${queryString}`
    );
    return response.tasks;
  }

  // Export
  async exportTasks(format: 'csv' | 'xlsx' | 'json', filters?: TaskSearchParams): Promise<Blob> {
    const params = { format, ...filters };
    const queryString = buildQueryParams(params);

    const response = await fetch(`${apiClient.baseUrl}/tasks/export?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${apiClient.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }
}

// Singleton instance
export const taskService = new TaskService();
