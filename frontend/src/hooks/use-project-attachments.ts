import { useCallback, useState } from 'react';
import { projectService } from '../services/project-service';
import type { FileUploadResponse, ProjectAttachment } from '../types/project';

interface UseProjectAttachmentsReturn {
  attachments: ProjectAttachment[];
  uploading: boolean;
  loading: boolean;
  error: string | null;
  getAttachments: (projectId: string) => Promise<ProjectAttachment[]>;
  uploadFile: (projectId: string, file: File) => Promise<FileUploadResponse>;
  deleteAttachment: (projectId: string, attachmentId: string) => Promise<void>;
  clearError: () => void;
}

export const useProjectAttachments = (): UseProjectAttachmentsReturn => {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>,
    useUploadingState = false
  ): Promise<T> => {
    if (useUploadingState) {
      setUploading(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await request();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      if (useUploadingState) {
        setUploading(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const getAttachments = useCallback(async (projectId: string): Promise<ProjectAttachment[]> => {
    return handleRequest(async () => {
      const result = await projectService.getProjectAttachments(projectId);
      setAttachments(result);
      return result;
    });
  }, [handleRequest]);

  const uploadFile = useCallback(async (projectId: string, file: File): Promise<FileUploadResponse> => {
    return handleRequest(async () => {
      const response = await projectService.uploadProjectFile(projectId, file);
      // Refresh attachments list
      await getAttachments(projectId);
      return response;
    }, true);
  }, [handleRequest, getAttachments]);

  const deleteAttachment = useCallback(async (projectId: string, attachmentId: string): Promise<void> => {
    return handleRequest(async () => {
      await projectService.deleteProjectAttachment(projectId, attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    });
  }, [handleRequest]);

  return {
    attachments,
    uploading,
    loading,
    error,
    getAttachments,
    uploadFile,
    deleteAttachment,
    clearError,
  };
};
