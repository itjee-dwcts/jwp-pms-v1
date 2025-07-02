import type { Project, ProjectAttachment, ProjectComment, ProjectMember } from '@/types/project';
import { useCallback, useState } from 'react';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  projectMembers: ProjectMember[];
  projectComments: ProjectComment[];
  projectAttachments: ProjectAttachment[];
  loading: boolean;
  error: string | null;
}

interface UseProjectStateReturn extends ProjectState {
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setProjectMembers: (members: ProjectMember[]) => void;
  setProjectComments: (comments: ProjectComment[]) => void;
  setProjectAttachments: (attachments: ProjectAttachment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addProject: (project: Project) => void;
  updateProjectInList: (id: number, updates: Partial<Project>) => void;
  removeProject: (id: number) => void;
  addMember: (member: ProjectMember) => void;
  updateMember: (id: number, updates: Partial<ProjectMember>) => void;
  removeMember: (id: number) => void;
  addComment: (comment: ProjectComment) => void;
  updateComment: (id: number, updates: Partial<ProjectComment>) => void;
  removeComment: (id: number) => void;
  addAttachment: (attachment: ProjectAttachment) => void;
  removeAttachment: (id: number) => void;
}

export const useProjectState = (): UseProjectStateReturn => {
  const [state, setState] = useState<ProjectState>({
    projects: [],
    currentProject: null,
    projectMembers: [],
    projectComments: [],
    projectAttachments: [],
    loading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<ProjectState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setProjects = useCallback((projects: Project[]) => {
    updateState({ projects });
  }, [updateState]);

  const setCurrentProject = useCallback((currentProject: Project | null) => {
    updateState({ currentProject });
  }, [updateState]);

  const setProjectMembers = useCallback((projectMembers: ProjectMember[]) => {
    updateState({ projectMembers });
  }, [updateState]);

  const setProjectComments = useCallback((projectComments: ProjectComment[]) => {
    updateState({ projectComments });
  }, [updateState]);

  const setProjectAttachments = useCallback((projectAttachments: ProjectAttachment[]) => {
    updateState({ projectAttachments });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const addProject = useCallback((project: Project) => {
    setState(prev => ({
      ...prev,
      projects: [...prev.projects, project],
    }));
  }, []);

  const updateProjectInList = useCallback((id: number, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === id ? { ...project, ...updates } : project
      ),
    }));
  }, []);

  const removeProject = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id),
    }));
  }, []);

  const addMember = useCallback((member: ProjectMember) => {
    setState(prev => ({
      ...prev,
      projectMembers: [...prev.projectMembers, member],
    }));
  }, []);

  const updateMember = useCallback((id: number, updates: Partial<ProjectMember>) => {
    setState(prev => ({
      ...prev,
      projectMembers: prev.projectMembers.map(member =>
        member.id === id ? { ...member, ...updates } : member
      ),
    }));
  }, []);

  const removeMember = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      projectMembers: prev.projectMembers.filter(member => member.id !== id),
    }));
  }, []);

  const addComment = useCallback((comment: ProjectComment) => {
    setState(prev => ({
      ...prev,
      projectComments: [...prev.projectComments, comment],
    }));
  }, []);

  const updateComment = useCallback((id: number, updates: Partial<ProjectComment>) => {
    setState(prev => ({
      ...prev,
      projectComments: prev.projectComments.map(comment =>
        comment.id === id ? { ...comment, ...updates } : comment
      ),
    }));
  }, []);

  const removeComment = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      projectComments: prev.projectComments.filter(comment => comment.id !== id),
    }));
  }, []);

  const addAttachment = useCallback((attachment: ProjectAttachment) => {
    setState(prev => ({
      ...prev,
      projectAttachments: [...prev.projectAttachments, attachment],
    }));
  }, []);

  const removeAttachment = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      projectAttachments: prev.projectAttachments.filter(attachment => attachment.id !== id),
    }));
  }, []);

  return {
    ...state,
    setProjects,
    setCurrentProject,
    setProjectMembers,
    setProjectComments,
    setProjectAttachments,
    setLoading,
    setError,
    clearError,
    addProject,
    updateProjectInList,
    removeProject,
    addMember,
    updateMember,
    removeMember,
    addComment,
    updateComment,
    removeComment,
    addAttachment,
    removeAttachment,
  };
};
