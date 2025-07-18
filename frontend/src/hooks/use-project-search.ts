import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '../hooks/use-debounce';
import { projectService } from '../services/project-service';
import type { Project, ProjectSearchParams } from '../types/project';

interface UseProjectSearchReturn {
  searchResults: Project[];
  searching: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  search: (query: string, filters?: ProjectSearchParams) => Promise<void>;
}

export const useProjectSearch = (debounceMs: number = 300): UseProjectSearchReturn => {
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);

  const search = useCallback(async (query: string, filters?: ProjectSearchParams) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const results = await projectService.searchProjects(query, filters);
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
