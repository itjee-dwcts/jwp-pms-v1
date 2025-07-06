import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '../hooks/use-debounce';
import { taskService } from '../services/task-service';
import type { Task, TaskSearchParams } from '../types/task';

interface UseTaskSearchReturn {
  searchResults: Task[];
  searching: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  search: (query: string, filters?: TaskSearchParams) => Promise<void>;
}

export const useTaskSearch = (debounceMs: number = 300): UseTaskSearchReturn => {
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);

  const search = useCallback(async (query: string, filters?: TaskSearchParams) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const results = await taskService.searchTasks(query, filters);
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
