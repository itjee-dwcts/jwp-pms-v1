import type { User } from '@/types/user';
import { useCallback, useState } from 'react';

interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

interface UseUserStateReturn extends UserState {
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addUser: (user: User) => void;
  updateUserInList: (id: number, updates: Partial<User>) => void;
  removeUser: (id: number) => void;
}

export const useUserState = (): UseUserStateReturn => {
  const [state, setState] = useState<UserState>({
    users: [],
    currentUser: null,
    loading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<UserState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setUsers = useCallback((users: User[]) => {
    updateState({ users });
  }, [updateState]);

  const setCurrentUser = useCallback((currentUser: User | null) => {
    updateState({ currentUser });
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

  const addUser = useCallback((user: User) => {
    setState(prev => ({
      ...prev,
      users: [...prev.users, user],
    }));
  }, []);

  const updateUserInList = useCallback((id: number, updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(user =>
        user.id === id ? { ...user, ...updates } : user
      ),
    }));
  }, []);

  const removeUser = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== id),
    }));
  }, []);

  return {
    ...state,
    setUsers,
    setCurrentUser,
    setLoading,
    setError,
    clearError,
    addUser,
    updateUserInList,
    removeUser,
  };
};
