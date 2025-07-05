import { userService } from '@/services/user-service';
import type { AvatarUploadResponse } from '@/types/user';
import { useCallback, useState } from 'react';

interface UseUserAvatarReturn {
  uploading: boolean;
  error: string | null;
  uploadAvatar: (userId: string, file: File) => Promise<AvatarUploadResponse>;
  deleteAvatar: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useUserAvatar = (): UseUserAvatarReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadAvatar = useCallback(async (userId: string, file: File): Promise<AvatarUploadResponse> => {
    setUploading(true);
    setError(null);
    try {
      const result = await userService.uploadAvatar(userId, file);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Avatar upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteAvatar = useCallback(async (userId: string): Promise<void> => {
    setUploading(true);
    setError(null);
    try {
      await userService.deleteAvatar(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Avatar deletion failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploading,
    error,
    uploadAvatar,
    deleteAvatar,
    clearError,
  };
};
