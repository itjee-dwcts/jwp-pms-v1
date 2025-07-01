import { useCallback, useState } from 'react';
import { apiClient } from './useAuth';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date?: string;
  budget?: number;
  created_at: string;
  updated_at: string;
  owner: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  members?: ProjectMember[];
  tasks?: Task[];
  comments?: ProjectComment[];
  attachments?: ProjectAttachment[];
  tags?: string[];
  member_count?: number;
  task_count?: number;
  completed_task_count?: number;
}

export interface ProjectMember {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  role: string;
  joined_at: string;
  is_active: boolean;
}

export interface ProjectComment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface ProjectAttachment {
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

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  assignees: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

export interface ProjectCreateRequest {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date?: string;
  budget?: number;
  tags?: string[];
  member_ids?: number[];
}

export interface ProjectUpdateRequest extends Partial<ProjectCreateRequest> {
  id: number;
}

export interface ProjectSearchParams {
  search?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  owner_id?: number;
  member_id?: number;
  tags?: string[];
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProjectStatsResponse {
  total_projects: number;
  by_status: Record<ProjectStatus, number>;
  by_priority: Record<ProjectPriority, number>;
  completion_rate: number;
  average_duration: number;
}

export interface CommentCreateRequest {
  content: string;
}

export interface CommentUpdateRequest {
  content: string;
}

export interface MemberAddRequest {
  user_id: number;
  role: string;
}

export interface MemberUpdateRequest {
  role: string;
}

export interface FileUploadResponse {
  id: number;
  file_name: string;
  file_size: number;
  file_path: string;
  url: string;
}

export const useProjects = () => {
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

  // Project CRUD operations
  const getProjects = useCallback(async (params?: ProjectSearchParams): Promise<Project[]> => {
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

      const response = await apiClient.request<ProjectListResponse>(
        `/projects?${queryParams.toString()}`
      );
      return response.projects;
    });
  }, [handleRequest]);

  const getProject = useCallback(async (id: number): Promise<Project> => {
    return handleRequest(async () => {
      return apiClient.request<Project>(`/projects/${id}`);
    });
  }, [handleRequest]);

  const createProject = useCallback(async (data: ProjectCreateRequest): Promise<Project> => {
    return handleRequest(async () => {
      return apiClient.request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const updateProject = useCallback(async (id: number, data: Partial<ProjectCreateRequest>): Promise<Project> => {
    return handleRequest(async () => {
      return apiClient.request<Project>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const deleteProject = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/projects/${id}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Project statistics
  const getProjectStats = useCallback(async (params?: ProjectSearchParams): Promise<ProjectStatsResponse> => {
    return handleRequest(async () => {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      return apiClient.request<ProjectStatsResponse>(
        `/projects/stats?${queryParams.toString()}`
      );
    });
  }, [handleRequest]);

  // Project members management
  const getProjectMembers = useCallback(async (projectId: number): Promise<ProjectMember[]> => {
    return handleRequest(async () => {
      return apiClient.request<ProjectMember[]>(`/projects/${projectId}/members`);
    });
  }, [handleRequest]);

  const addProjectMember = useCallback(async (projectId: number, data: MemberAddRequest): Promise<ProjectMember> => {
    return handleRequest(async () => {
      return apiClient.request<ProjectMember>(`/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const updateProjectMember = useCallback(async (
    projectId: number,
    memberId: number,
    data: MemberUpdateRequest
  ): Promise<ProjectMember> => {
    return handleRequest(async () => {
      return apiClient.request<ProjectMember>(`/projects/${projectId}/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const removeProjectMember = useCallback(async (projectId: number, memberId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Project comments
  const getProjectComments = useCallback(async (projectId: number): Promise<ProjectComment[]> => {
    return handleRequest(async () => {
      return apiClient.request<ProjectComment[]>(`/projects/${projectId}/comments`);
    });
  }, [handleRequest]);

  const addProjectComment = useCallback(async (
    projectId: number,
    data: CommentCreateRequest
  ): Promise<ProjectComment> => {
    return handleRequest(async () => {
      return apiClient.request<ProjectComment>(`/projects/${projectId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const updateProjectComment = useCallback(async (
    projectId: number,
    commentId: number,
    data: CommentUpdateRequest
  ): Promise<ProjectComment> => {
    return handleRequest(async () => {
      return apiClient.request<ProjectComment>(`/projects/${projectId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    });
  }, [handleRequest]);

  const deleteProjectComment = useCallback(async (projectId: number, commentId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/projects/${projectId}/comments/${commentId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Project attachments
  const getProjectAttachments = useCallback(async (projectId: number): Promise<ProjectAttachment[]> => {
    return handleRequest(async () => {
      return apiClient.request<ProjectAttachment[]>(`/projects/${projectId}/attachments`);
    });
  }, [handleRequest]);

  const uploadProjectFile = useCallback(async (projectId: number, file: File): Promise<FileUploadResponse> => {
    return handleRequest(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiClient['baseUrl']}/projects/${projectId}/attachments`, {
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

  const deleteProjectAttachment = useCallback(async (projectId: number, attachmentId: number): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request(`/projects/${projectId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
    });
  }, [handleRequest]);

  // Project duplication
  const duplicateProject = useCallback(async (
    id: number,
    options?: {
      include_members?: boolean;
      include_tasks?: boolean;
      include_attachments?: boolean;
    }
  ): Promise<Project> => {
    return handleRequest(async () => {
      return apiClient.request<Project>(`/projects/${id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify(options || {}),
      });
    });
  }, [handleRequest]);

  // Project archiving
  const archiveProject = useCallback(async (id: number): Promise<Project> => {
    return handleRequest(async () => {
      return apiClient.request<Project>(`/projects/${id}/archive`, {
        method: 'POST',
      });
    });
  }, [handleRequest]);

  const unarchiveProject = useCallback(async (id: number): Promise<Project> => {
    return handleRequest(async () => {
      return apiClient.request<Project>(`/projects/${id}/unarchive`, {
        method: 'POST',
      });
    });
  }, [handleRequest]);

  // Bulk operations
  const bulkUpdateProjects = useCallback(async (
    ids: number[],
    updates: Partial<ProjectCreateRequest>
  ): Promise<Project[]> => {
    return handleRequest(async () => {
      return apiClient.request<Project[]>('/projects/bulk-update', {
        method: 'PUT',
        body: JSON.stringify({ ids, updates }),
      });
    });
  }, [handleRequest]);

  const bulkDeleteProjects = useCallback(async (ids: number[]): Promise<void> => {
    return handleRequest(async () => {
      await apiClient.request('/projects/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      });
    });
  }, [handleRequest]);

  return {
    // State
    loading,
    error,
    clearError,

    // Project CRUD
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,

    // Statistics
    getProjectStats,

    // Members
    getProjectMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,

    // Comments
    getProjectComments,
    addProjectComment,
    updateProjectComment,
    deleteProjectComment,

    // Attachments
    getProjectAttachments,
    uploadProjectFile,
    deleteProjectAttachment,

    // Advanced operations
    duplicateProject,
    archiveProject,
    unarchiveProject,

    // Bulk operations
    bulkUpdateProjects,
    bulkDeleteProjects,
  };
};

export default useProjects;
