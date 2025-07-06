import React, { createContext, useContext } from 'react';
import { useProjects } from '../hooks/use-projects';

type ProjectContextType = ReturnType<typeof useProjects>;

const ProjectContext = createContext<ProjectContextType | null>(null);

interface ProjectProviderProps {
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const projectMethods = useProjects();

  return (
    <ProjectContext.Provider value={projectMethods}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};
