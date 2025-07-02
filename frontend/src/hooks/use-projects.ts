import { projectService } from '@/services/project-service';
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
  ProjectMember,
  ProjectSearchParams,
  ProjectStatsResponse,
  ProjectTemplate,
} from '@/types/project';
import { useCallback } from 'react';
import { useProjectState } from './use-project-state';

export const useProjects = () => {
  const projectState = useProjectState();

  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<T> => {
    projectState.setLoading(true);
    projectState.setError(null);
    try {
      const result = await request();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      projectState.setError(errorMessage);
      throw err;
    } finally {
      projectState.setLoading(false);
    }
  }, [projectState]);

  // CRUD Operations
  const getProjects = useCallback(async (params?: ProjectSearchParams): Promise<Project[]> => {
    return handleRequest(async () => {
      const projects = await projectService.getProjects(params);
      projectState.setProjects(projects);
      return projects;
    });
  }, [handleRequest, projectState]);

  const getProject = useCallback(async (id: number): Promise<Project> => {
    return handleRequest(async () => {
      const project = await projectService.getProject(id);
      projectState.setCurrentProject(project);
      return project;
    });
  }, [handleRequest, projectState]);

  const createProject = useCallback(async (data: ProjectCreateRequest): Promise<Project> => {
    return handleRequest(async () => {
      const project = await projectService.createProject(data);
      projectState.addProject(project);
      return project;
    });
  }, [handleRequest, projectState]);

  const updateProject = useCallback(async (id: number, data: Partial<ProjectCreateRequest>): Promise<Project> => {
    return handleRequest(async () => {
      const project = await projectService.updateProject(id, data);
      projectState.updateProjectInList(id, project);
      if (projectState.currentProject?.id === id) {
        projectState.setCurrentProject(project);
      }
      return project;
    });
  }, [handleRequest, projectState]);

  const deleteProject = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await projectService.deleteProject(id);
      projectState.removeProject(id);
      if (projectState.currentProject?.id === id) {
        projectState.setCurrentProject(null);
      }
    });
  }, [handleRequest, projectState]);

  // Statistics
  const getProjectStats = useCallback(async (params?: ProjectSearchParams): Promise<ProjectStatsResponse> => {
    return handleRequest(() => projectService.getProjectStats(params));
  }, [handleRequest]);

  // Members Management
  const getProjectMembers = useCallback(async (projectId: number): Promise<ProjectMember[]> => {
    return handleRequest(async () => {
      const members = await projectService.getProjectMembers(projectId);
      projectState.setProjectMembers(members);
      return members;
    });
  }, [handleRequest, projectState]);

  const addProjectMember = useCallback(async (projectId: number, data: MemberAddRequest): Promise<ProjectMember> => {
    return handleRequest(async () => {
      const member = await projectService.addProjectMember(projectId, data);
      projectState.addMember(member);
      return member;
    });
  }, [handleRequest, projectState]);

  const updateProjectMember = useCallback(async (
    projectId: number,
    memberId: number,
    data: MemberUpdateRequest
  ): Promise<ProjectMember> => {
    return handleRequest(async () => {
      const member = await projectService.updateProjectMember(projectId, memberId, data);
      projectState.updateMember(memberId, member);
      return member;
    });
  }, [handleRequest, projectState]);

  const removeProjectMember = useCallback(async (projectId: number, memberId: number): Promise<void> => {
    return handleRequest(async () => {
      await projectService.removeProjectMember(projectId, memberId);
      projectState.removeMember(memberId);
    });
  }, [handleRequest, projectState]);

  // Comments Management
  const getProjectComments = useCallback(async (projectId: number): Promise<ProjectComment[]> => {
    return handleRequest(async () => {
      const comments = await projectService.getProjectComments(projectId);
      projectState.setProjectComments(comments);
      return comments;
    });
  }, [handleRequest, projectState]);

  const addProjectComment = useCallback(async (
    projectId: number,
    data: CommentCreateRequest
  ): Promise<ProjectComment> => {
    return handleRequest(async () => {
      const comment = await projectService.addProjectComment(projectId, data);
      projectState.addComment(comment);
      return comment;
    });
  }, [handleRequest, projectState]);

  const updateProjectComment = useCallback(async (
    projectId: number,
    commentId: number,
    data: CommentUpdateRequest
  ): Promise<ProjectComment> => {
    return handleRequest(async () => {
      const comment = await projectService.updateProjectComment(projectId, commentId, data);
      projectState.updateComment(commentId, comment);
      return comment;
    });
  }, [handleRequest, projectState]);

  const deleteProjectComment = useCallback(async (projectId: number, commentId: number): Promise<void> => {
    return handleRequest(async () => {
      await projectService.deleteProjectComment(projectId, commentId);
      projectState.removeComment(commentId);
    });
  }, [handleRequest, projectState]);

  // Attachments Management
  const getProjectAttachments = useCallback(async (projectId: number): Promise<ProjectAttachment[]> => {
    return handleRequest(async () => {
      const attachments = await projectService.getProjectAttachments(projectId);
      projectState.setProjectAttachments(attachments);
      return attachments;
    });
  }, [handleRequest, projectState]);

  const uploadProjectFile = useCallback(async (projectId: number, file: File): Promise<FileUploadResponse> => {
    return handleRequest(async () => {
      const response = await projectService.uploadProjectFile(projectId, file);
      // Refresh attachments list
      await getProjectAttachments(projectId);
      return response;
    });
  }, [handleRequest, getProjectAttachments]);

  const deleteProjectAttachment = useCallback(async (projectId: number, attachmentId: number): Promise<void> => {
    return handleRequest(async () => {
      await projectService.deleteProjectAttachment(projectId, attachmentId);
      projectState.removeAttachment(attachmentId);
    });
  }, [handleRequest, projectState]);

  // Advanced Operations
  const duplicateProject = useCallback(async (id: number, options?: ProjectDuplicateOptions): Promise<Project> => {
    return handleRequest(async () => {
      const project = await projectService.duplicateProject(id, options);
      projectState.addProject(project);
      return project;
    });
  }, [handleRequest, projectState]);

  const archiveProject = useCallback(async (id: number): Promise<Project> => {
    return handleRequest(async () => {
      const project = await projectService.archiveProject(id);
      projectState.updateProjectInList(id, project);
      return project;
    });
  }, [handleRequest, projectState]);

  const unarchiveProject = useCallback(async (id: number): Promise<Project> => {
    return handleRequest(async () => {
      const project = await projectService.unarchiveProject(id);
      projectState.updateProjectInList(id, project);
      return project;
    });
  }, [handleRequest, projectState]);

  // Bulk Operations
  const bulkUpdateProjects = useCallback(async (data: BulkProjectUpdateRequest): Promise<Project[]> => {
    return handleRequest(async () => {
      const projects = await projectService.bulkUpdateProjects(data);
      projects.forEach(project => {
        projectState.updateProjectInList(project.id, project);
      });
      return projects;
    });
  }, [handleRequest, projectState]);

  const bulkDeleteProjects = useCallback(async (data: BulkProjectDeleteRequest): Promise<void> => {
    return handleRequest(async () => {
      await projectService.bulkDeleteProjects(data);
      data.ids.forEach(id => {
        projectState.removeProject(id);
      });
    });
  }, [handleRequest, projectState]);

  // Activity & History
  const getProjectActivity = useCallback(async (projectId: number): Promise<ProjectActivityLog[]> => {
    return handleRequest(() => projectService.getProjectActivity(projectId));
  }, [handleRequest]);

  // Templates
  const getProjectTemplates = useCallback(async (): Promise<ProjectTemplate[]> => {
    return handleRequest(() => projectService.getProjectTemplates());
  }, [handleRequest]);

  const createProjectFromTemplate = useCallback(async (templateId: number, data: Partial<ProjectCreateRequest>): Promise<Project> => {
    return handleRequest(async () => {
      const project = await projectService.createProjectFromTemplate(templateId, data);
      projectState.addProject(project);
      return project;
    });
  }, [handleRequest, projectState]);

  // Search
  const searchProjects = useCallback(async (query: string, filters?: {
    status?: string;
    priority?: string;
    page_size?: number;
  }): Promise<Project[]> => {
    return handleRequest(async () => {
      const projects = await projectService.searchProjects(query, filters);
      projectState.setProjects(projects);
      return projects;
    });
  }, [handleRequest, projectState]);

  // Export
  const exportProjects = useCallback(async (
    format: 'csv' | 'xlsx' | 'json',
    filters?: ProjectSearchParams
  ): Promise<Blob> => {
    return handleRequest(() => projectService.exportProjects(format, filters));
  }, [handleRequest]);


  return {
    // State
    ...projectState,

    // CRUD Operations
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,

    // Statistics
    getProjectStats,

    // Members Management
    getProjectMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,

    // Comments Management
    getProjectComments,
    addProjectComment,
    updateProjectComment,
    deleteProjectComment,

    // Attachments Management
    getProjectAttachments,
    uploadProjectFile,
    deleteProjectAttachment,

    // Advanced Operations
    duplicateProject,
    archiveProject,
    unarchiveProject,

    // Bulk Operations
    bulkUpdateProjects,
    bulkDeleteProjects,

    // Activity & History
    getProjectActivity,

    // Templates
    getProjectTemplates,
    createProjectFromTemplate,

    // Search & Export
    searchProjects,
    exportProjects,
  };
};
