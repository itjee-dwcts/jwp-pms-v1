import { apiClient } from '../services/api-client';
import type {
  BulkProjectDeleteRequest,
  BulkProjectUpdateRequest,
  CommentCreateRequest,
  CommentUpdateRequest,
  FileUploadResponse,
  MemberAddRequest,
  MemberUpdateRequest,
  Project,
  ProjectActivityLog,
  ProjectAttachment,
  ProjectComment,
  ProjectCreateRequest,
  ProjectDuplicateOptions,
  ProjectListResponse,
  ProjectMember,
  ProjectSearchParams,
  ProjectStatsResponse,
  ProjectTemplate
} from '../types/project';
import { buildQueryParams } from '../utils/query-params';

export class ProjectService {
  private readonly baseUrl = '/api/v1/projects';

  // CRUD Operations
  async getProjects(params?: ProjectSearchParams): Promise<ProjectListResponse> {
    const queryString = params ? buildQueryParams(params) : '';
    const response = await apiClient.request<ProjectListResponse>(
      `${this.baseUrl}${queryString ? `?${queryString}` : ''}`
    );
    return response;
  }

  async getProject(id: string): Promise<Project> {
    return apiClient.request<Project>(`${this.baseUrl}/${id}`);
  }

  async createProject(data: ProjectCreateRequest): Promise<Project> {
    return apiClient.request<Project>(`${this.baseUrl}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<ProjectCreateRequest>): Promise<Project> {
    return apiClient.request<Project>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getProjectStats(params?: ProjectSearchParams): Promise<ProjectStatsResponse> {
    const queryString = params ? buildQueryParams(params) : '';
    return apiClient.request<ProjectStatsResponse>(
      `${this.baseUrl}/stats${queryString ? `?${queryString}` : ''}`
    );
  }

  // Members Management
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return apiClient.request<ProjectMember[]>(`${this.baseUrl}/${projectId}/members`);
  }

  async addProjectMember(projectId: string, data: MemberAddRequest): Promise<ProjectMember> {
    return apiClient.request<ProjectMember>(`${this.baseUrl}/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProjectMember(
    projectId: string,
    memberId: string,
    data: MemberUpdateRequest
  ): Promise<ProjectMember> {
    return apiClient.request<ProjectMember>(`${this.baseUrl}/${projectId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${projectId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Comments Management
  async getProjectComments(projectId: string): Promise<ProjectComment[]> {
    return apiClient.request<ProjectComment[]>(`${this.baseUrl}/${projectId}/comments`);
  }

  async addProjectComment(
    projectId: string,
    data: CommentCreateRequest
  ): Promise<ProjectComment> {
    return apiClient.request<ProjectComment>(`${this.baseUrl}/${projectId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProjectComment(
    projectId: string,
    commentId: string,
    data: CommentUpdateRequest
  ): Promise<ProjectComment> {
    return apiClient.request<ProjectComment>(`${this.baseUrl}/${projectId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProjectComment(projectId: string, commentId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${projectId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Attachments Management
  async getProjectAttachments(projectId: string): Promise<ProjectAttachment[]> {
    return apiClient.request<ProjectAttachment[]>(`${this.baseUrl}/${projectId}/attachments`);
  }

  async uploadProjectFile(projectId: string, file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/${projectId}/attachments`, {
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

  async deleteProjectAttachment(projectId: string, attachmentId: string): Promise<void> {
    await apiClient.request(`${this.baseUrl}/${projectId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // Advanced Operations
  async duplicateProject(id: string, options?: ProjectDuplicateOptions): Promise<Project> {
    return apiClient.request<Project>(`${this.baseUrl}/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async archiveProject(id: string): Promise<Project> {
    return apiClient.request<Project>(`${this.baseUrl}/${id}/archive`, {
      method: 'POST',
    });
  }

  async unarchiveProject(id: string): Promise<Project> {
    return apiClient.request<Project>(`${this.baseUrl}/${id}/unarchive`, {
      method: 'POST',
    });
  }

  // Bulk Operations
  async bulkUpdateProjects(data: BulkProjectUpdateRequest): Promise<Project[]> {
    return apiClient.request<Project[]>(`${this.baseUrl}/bulk-update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async bulkDeleteProjects(data: BulkProjectDeleteRequest): Promise<void> {
    await apiClient.request(`${this.baseUrl}/bulk-delete`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // Activity & History
  async getProjectActivity(projectId: string): Promise<ProjectActivityLog[]> {
    return apiClient.request<ProjectActivityLog[]>(`${this.baseUrl}/${projectId}/activity`);
  }

  // Templates
  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    return apiClient.request<ProjectTemplate[]>(`${this.baseUrl}/templates`);
  }

  async createProjectFromTemplate(templateId: string, data: Partial<ProjectCreateRequest>): Promise<Project> {
    return apiClient.request<Project>(`${this.baseUrl}/templates/${templateId}/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Search & Filter helpers
  async searchProjects(query: string, filters?: {
    status?: string;
    priority?: string;
    page_size?: number;
  }): Promise<Project[]> {
    const params = { search: query, ...filters };
    const queryString = buildQueryParams(params);

    const response = await apiClient.request<ProjectListResponse>(
      `${this.baseUrl}/search?${queryString}`
    );
    return response.projects;
  }

  // Export
  async exportProjects(format: 'csv' | 'xlsx' | 'json', filters?: ProjectSearchParams): Promise<Blob> {
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
export const projectService = new ProjectService();
