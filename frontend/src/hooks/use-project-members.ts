import { projectService } from '@/services/project-service';
import type { MemberAddRequest, MemberUpdateRequest, ProjectMember } from '@/types/project';
import { useCallback, useState } from 'react';

interface UseProjectMembersReturn {
  members: ProjectMember[];
  loading: boolean;
  error: string | null;
  getMembers: (projectId: number) => Promise<ProjectMember[]>;
  addMember: (projectId: number, data: MemberAddRequest) => Promise<ProjectMember>;
  updateMember: (projectId: number, memberId: number, data: MemberUpdateRequest) => Promise<ProjectMember>;
  removeMember: (projectId: number, memberId: number) => Promise<void>;
  clearError: () => void;
}

export const useProjectMembers = (): UseProjectMembersReturn => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
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

  const getMembers = useCallback(async (projectId: number): Promise<ProjectMember[]> => {
    return handleRequest(async () => {
      const result = await projectService.getProjectMembers(projectId);
      setMembers(result);
      return result;
    });
  }, [handleRequest]);

  const addMember = useCallback(async (projectId: number, data: MemberAddRequest): Promise<ProjectMember> => {
    return handleRequest(async () => {
      const member = await projectService.addProjectMember(projectId, data);
      setMembers(prev => [...prev, member]);
      return member;
    });
  }, [handleRequest]);

  const updateMember = useCallback(async (
    projectId: number,
    memberId: number,
    data: MemberUpdateRequest
  ): Promise<ProjectMember> => {
    return handleRequest(async () => {
      const member = await projectService.updateProjectMember(projectId, memberId, data);
      setMembers(prev => prev.map(m => m.id === memberId ? member : m));
      return member;
    });
  }, [handleRequest]);

  const removeMember = useCallback(async (projectId: number, memberId: number): Promise<void> => {
    return handleRequest(async () => {
      await projectService.removeProjectMember(projectId, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    });
  }, [handleRequest]);

  return {
    members,
    loading,
    error,
    getMembers,
    addMember,
    updateMember,
    removeMember,
    clearError,
  };
};
