import { useTasks } from '@/hooks/use-tasks';
import React, { createContext, useContext } from 'react';

type TaskContextType = ReturnType<typeof useTasks>;

const TaskContext = createContext<TaskContextType | null>(null);

interface TaskProviderProps {
  children: React.ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const taskMethods = useTasks();

  return (
    <TaskContext.Provider value={taskMethods}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
