import React, { createContext, useContext, useEffect } from 'react';
import { useAuthState } from '../hooks/use-auth-state';
import { config } from '../lib/config';
import type { AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthState();

  // Check authentication status on mount
  useEffect(() => {
    auth.checkAuthStatus();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await auth.refreshToken();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
        auth.logout();
      }
    }, config.TOKEN_REFRESH_THRESHOLD);

    return () => clearInterval(interval);
  }, [auth.isAuthenticated, auth.refreshToken, auth.logout]);

  // Show loading state while checking authentication
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
