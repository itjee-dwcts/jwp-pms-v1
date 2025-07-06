import React, { createContext, useContext } from 'react';
import { useUsers } from '../hooks/use-users';

type UserContextType = ReturnType<typeof useUsers>;

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const userMethods = useUsers();

  return (
    <UserContext.Provider value={userMethods}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
