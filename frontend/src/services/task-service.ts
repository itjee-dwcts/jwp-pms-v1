import { apiClient } from '../services/api-client';
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
  TaskTag,
  TaskTimeLog,
  TimeLogCreateRequest
} from '../types/task';
import { buildQueryParams } from '../utils/query-params';

export class TaskService {
  private readonly baseUrl = '/api/v1/tasks';

  // CRUD Operations
  async getTasks(params?: TaskSearchParams): Promise<TaskListResponse> {
    const queryString = params ? buildQueryParams(params) : '';
    const response = await apiClient.request<TaskListResponse>(
      `${this.baseUrl}${queryString ? `?${queryString}` : ''}`
    );
    return response;
  }

  async getTask(id: string): Promise<Task> {
    return apiClient.request<Task>(`${this.baseUrl}/${id}`);
  }

  async createTask(data: TaskCreateRequest): Promise<Task> {
    return apiClient.request<Task>(`${this.baseUrl}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: Partial<TaskCreateRequest>): Promise<Task> {
    return apiClient.request<Task>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  // 프로젝트별 작업 조회 전용 메서드
  async getTasksByProject(
    projectId: number,
    params?: Omit<TaskSearchParams, 'project_id'>
  ): Promise<TaskListResponse> {
    const searchParams = {
      ...params,
      project_id: projectId,
    };
    const queryString = buildQueryParams(searchParams);
    const response = await apiClient.request<TaskListResponse>(
      `${this.baseUrl}${queryString ? `?${queryString}` : ''}`
    );
    return response;
  }

  // Statistics
  async getTaskStats(params?: TaskSearchParams): Promise<TaskStatsResponse> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<TaskStatsResponse>(
      `${this.baseUrl}/stats${queryString ? `?${queryString}` : ''}`
    );
  }

  // Kanban Board
  async getKanbanBoard(projectId?: string): Promise<TaskKanbanBoard> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return apiClient.request<TaskKanbanBoard>(`${this.baseUrl}/kanban${params}`);
  }

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    return apiClient.request<Task>(`${this.baseUrl}/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Gantt Chart
  async getGanttChart(projectId?: string): Promise<TaskGanttChart> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return apiClient.request<TaskGanttChart>(`${this.baseUrl}/gantt${params}`);
  }

  // Task Assignments
  async getTaskAssignees(taskId: string): Promise<TaskAssignee[]> {
    return apiClient.request<TaskAssignee[]>(`${this.baseUrl}/${taskId}/assignees`);
  }

  async assignTask(taskId: string, data: AssignTaskRequest): Promise<TaskAssignee[]> {
    return apiClient.request<TaskAssignee[]>(`${this.baseUrl}/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unassignTask(taskId: string, userId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${taskId}/assignees/${userId}`, {
      method: 'DELETE',
    });
  }

  // Task Comments
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return apiClient.request<TaskComment[]>(`${this.baseUrl}/${taskId}/comments`);
  }

  async addTaskComment(taskId: string, data: CommentCreateRequest): Promise<TaskComment> {
    return apiClient.request<TaskComment>(`${this.baseUrl}/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTaskComment(
    taskId: string,
    commentId: string,
    data: CommentUpdateRequest
  ): Promise<TaskComment> {
    return apiClient.request<TaskComment>(`${this.baseUrl}/${taskId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTaskComment(taskId: string, commentId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Task Attachments
  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    return apiClient.request<TaskAttachment[]>(`${this.baseUrl}/${taskId}/attachments`);
  }

  async uploadTaskFile(taskId: string, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/${taskId}/attachments`, {
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

  async deleteTaskAttachment(taskId: string, attachmentId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // Task Time Logs
  async getTaskTimeLogs(taskId: string): Promise<TaskTimeLog[]> {
    return apiClient.request<TaskTimeLog[]>(`${this.baseUrl}/${taskId}/time-logs`);
  }

  async addTimeLog(taskId: string, data: TimeLogCreateRequest): Promise<TaskTimeLog> {
    return apiClient.request<TaskTimeLog>(`${this.baseUrl}/${taskId}/time-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTimeLog(
    taskId: string,
    timeLogId: string,
    data: Partial<TimeLogCreateRequest>
  ): Promise<TaskTimeLog> {
    return apiClient.request<TaskTimeLog>(`${this.baseUrl}/${taskId}/time-logs/${timeLogId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTimeLog(taskId: string, timeLogId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${taskId}/time-logs/${timeLogId}`, {
      method: 'DELETE',
    });
  }

  // Task Tags
  async getTags(): Promise<TaskTag[]> {
    return apiClient.request<TaskTag[]>(`${this.baseUrl}/tags`);
  }

  async createTag(data: TagCreateRequest): Promise<TaskTag> {
    return apiClient.request<TaskTag>(`${this.baseUrl}/tags`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addTaskTags(taskId: string, tagIds: string[]): Promise<TaskTag[]> {
    return apiClient.request<TaskTag[]>(`${this.baseUrl}/${taskId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_ids: tagIds }),
    });
  }

  async removeTaskTag(taskId: string, tagId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${taskId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  }

  // Task Dependencies
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    return apiClient.request<TaskDependency[]>(`${this.baseUrl}/${taskId}/dependencies`);
  }

  async addTaskDependency(taskId: string, data: DependencyCreateRequest): Promise<TaskDependency> {
    return apiClient.request<TaskDependency>(`${this.baseUrl}/${taskId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeTaskDependency(taskId: string, dependencyId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${taskId}/dependencies/${dependencyId}`, {
      method: 'DELETE',
    });
  }

  // Advanced Operations
  async duplicateTask(id: string, options?: TaskDuplicateOptions): Promise<Task> {
    return apiClient.request<Task>(`${this.baseUrl}/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  // Bulk Operations
  async bulkUpdateTasks(data: BulkTaskUpdateRequest): Promise<Task[]> {
    return apiClient.request<Task[]>(`${this.baseUrl}/bulk-update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async bulkDeleteTasks(data: BulkTaskDeleteRequest): Promise<void> {
    await apiClient.request(`${this.baseUrl}/bulk-delete`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  async bulkAssignTasks(data: BulkTaskAssignRequest): Promise<void> {
    await apiClient.request(`${this.baseUrl}/bulk-assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Search & Filter
  async searchTasks(query: string, filters?: {
    project_id?: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
    limit?: string;
  }): Promise<Task[]> {
    const params = { search: query, ...filters };
    const queryString = buildQueryParams(params);

    const response = await apiClient.request<TaskListResponse>(
      `${this.baseUrl}/search?${queryString}`
    );
    return response.tasks;
  }

  // Export
  async exportTasks(format: 'csv' | 'xlsx' | 'json', filters?: TaskSearchParams): Promise<Blob> {
    const params = { format, ...filters };
    const queryString = buildQueryParams(params);

    const response = await fetch(`${this.baseUrl}/export?${queryString}`, {
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
