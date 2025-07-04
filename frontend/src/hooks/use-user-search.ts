import { useDebounce } from '@/hooks/use-debounce';
import { userService } from '@/services/user-service';
import type { User } from '@/types/auth';
import type { UserSearchParams } from '@/types/user';
import { useCallback, useEffect, useState } from 'react';

interface UseUserSearchReturn {
  searchResults: User[];
  searching: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  search: (query: string, filters?: UserSearchParams) => Promise<void>;
}

export const useUserSearch = (debounceMs: number = 300): UseUserSearchReturn => {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);

  const search = useCallback(async (query: string, filters?: UserSearchParams) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const results = await userService.searchUsers(query, filters);
      setSearchResults(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      search(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, search]);

  return {
    searchResults,
    searching,
    error,
    searchQuery,
    setSearchQuery,
    clearSearch,
    search,
  };
};
