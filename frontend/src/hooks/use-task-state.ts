import type {
    Task,
    TaskAssignee,
    TaskAttachment,
    TaskComment,
    TaskDependency,
    TaskKanbanBoard,
    TaskTag,
    TaskTimeLog,
} from '@/types/task';
import { useCallback, useState } from 'react';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  taskAssignees: TaskAssignee[];
  taskComments: TaskComment[];
  taskAttachments: TaskAttachment[];
  taskTimeLogs: TaskTimeLog[];
  taskTags: TaskTag[];
  taskDependencies: TaskDependency[];
  kanbanBoard: TaskKanbanBoard | null;
  loading: boolean;
  error: string | null;
}

interface UseTaskStateReturn extends TaskState {
  setTasks: (tasks: Task[]) => void;
  setCurrentTask: (task: Task | null) => void;
  setTaskAssignees: (assignees: TaskAssignee[]) => void;
  setTaskComments: (comments: TaskComment[]) => void;
  setTaskAttachments: (attachments: TaskAttachment[]) => void;
  setTaskTimeLogs: (timeLogs: TaskTimeLog[]) => void;
  setTaskTags: (tags: TaskTag[]) => void;
  setTaskDependencies: (dependencies: TaskDependency[]) => void;
  setKanbanBoard: (board: TaskKanbanBoard | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addTask: (task: Task) => void;
  updateTaskInList: (id: number, updates: Partial<Task>) => void;
  removeTask: (id: number) => void;
  addAssignee: (assignee: TaskAssignee) => void;
  removeAssignee: (id: number) => void;
  addComment: (comment: TaskComment) => void;
  updateComment: (id: number, updates: Partial<TaskComment>) => void;
  removeComment: (id: number) => void;
  addAttachment: (attachment: TaskAttachment) => void;
  removeAttachment: (id: number) => void;
  addTimeLog: (timeLog: TaskTimeLog) => void;
  updateTimeLog: (id: number, updates: Partial<TaskTimeLog>) => void;
  removeTimeLog: (id: number) => void;
  addTag: (tag: TaskTag) => void;
  removeTag: (id: number) => void;
  addDependency: (dependency: TaskDependency) => void;
  removeDependency: (id: number) => void;
}

export const useTaskState = (): UseTaskStateReturn => {
  const [state, setState] = useState<TaskState>({
    tasks: [],
    currentTask: null,
    taskAssignees: [],
    taskComments: [],
    taskAttachments: [],
    taskTimeLogs: [],
    taskTags: [],
    taskDependencies: [],
    kanbanBoard: null,
    loading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<TaskState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setTasks = useCallback((tasks: Task[]) => {
    updateState({ tasks });
  }, [updateState]);

  const setCurrentTask = useCallback((currentTask: Task | null) => {
    updateState({ currentTask });
  }, [updateState]);

  const setTaskAssignees = useCallback((taskAssignees: TaskAssignee[]) => {
    updateState({ taskAssignees });
  }, [updateState]);

  const setTaskComments = useCallback((taskComments: TaskComment[]) => {
    updateState({ taskComments });
  }, [updateState]);

  const setTaskAttachments = useCallback((taskAttachments: TaskAttachment[]) => {
    updateState({ taskAttachments });
  }, [updateState]);

  const setTaskTimeLogs = useCallback((taskTimeLogs: TaskTimeLog[]) => {
    updateState({ taskTimeLogs });
  }, [updateState]);

  const setTaskTags = useCallback((taskTags: TaskTag[]) => {
    updateState({ taskTags });
  }, [updateState]);

  const setTaskDependencies = useCallback((taskDependencies: TaskDependency[]) => {
    updateState({ taskDependencies });
  }, [updateState]);

  const setKanbanBoard = useCallback((kanbanBoard: TaskKanbanBoard | null) => {
    updateState({ kanbanBoard });
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

  const addTask = useCallback((task: Task) => {
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));
  }, []);

  const updateTaskInList = useCallback((id: number, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }));
  }, []);

  const removeTask = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id),
    }));
  }, []);

  const addAssignee = useCallback((assignee: TaskAssignee) => {
    setState(prev => ({
      ...prev,
      taskAssignees: [...prev.taskAssignees, assignee],
    }));
  }, []);

  const removeAssignee = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      taskAssignees: prev.taskAssignees.filter(assignee => assignee.id !== id),
    }));
  }, []);

  const addComment = useCallback((comment: TaskComment) => {
    setState(prev => ({
      ...prev,
      taskComments: [...prev.taskComments, comment],
    }));
  }, []);

  const updateComment = useCallback((id: number, updates: Partial<TaskComment>) => {
    setState(prev => ({
      ...prev,
      taskComments: prev.taskComments.map(comment =>
        comment.id === id ? { ...comment, ...updates } : comment
      ),
    }));
  }, []);

  const removeComment = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      taskComments: prev.taskComments.filter(comment => comment.id !== id),
    }));
  }, []);

  const addAttachment = useCallback((attachment: TaskAttachment) => {
    setState(prev => ({
      ...prev,
      taskAttachments: [...prev.taskAttachments, attachment],
    }));
  }, []);

  const removeAttachment = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      taskAttachments: prev.taskAttachments.filter(attachment => attachment.id !== id),
    }));
  }, []);

  const addTimeLog = useCallback((timeLog: TaskTimeLog) => {
    setState(prev => ({
      ...prev,
      taskTimeLogs: [...prev.taskTimeLogs, timeLog],
    }));
  }, []);

  const updateTimeLog = useCallback((id: number, updates: Partial<TaskTimeLog>) => {
    setState(prev => ({
      ...prev,
      taskTimeLogs: prev.taskTimeLogs.map(timeLog =>
        timeLog.id === id ? { ...timeLog, ...updates } : timeLog
      ),
    }));
  }, []);

  const removeTimeLog = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      taskTimeLogs: prev.taskTimeLogs.filter(timeLog => timeLog.id !== id),
    }));
  }, []);

  const addTag = useCallback((tag: TaskTag) => {
    setState(prev => ({
      ...prev,
      taskTags: [...prev.taskTags, tag],
    }));
  }, []);

  const removeTag = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      taskTags: prev.taskTags.filter(tag => tag.id !== id),
    }));
  }, []);

  const addDependency = useCallback((dependency: TaskDependency) => {
    setState(prev => ({
      ...prev,
      taskDependencies: [...prev.taskDependencies, dependency],
    }));
  }, []);

  const removeDependency = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      taskDependencies: prev.taskDependencies.filter(dependency => dependency.id !== id),
    }));
  }, []);

  return {
    ...state,
    setTasks,
    setCurrentTask,
    setTaskAssignees,
    setTaskComments,
    setTaskAttachments,
    setTaskTimeLogs,
    setTaskTags,
    setTaskDependencies,
    setKanbanBoard,
    setLoading,
    setError,
    clearError,
    addTask,
    updateTaskInList,
    removeTask,
    addAssignee,
    removeAssignee,
    addComment,
    updateComment,
    removeComment,
    addAttachment,
    removeAttachment,
    addTimeLog,
    updateTimeLog,
    removeTimeLog,
    addTag,
    removeTag,
    addDependency,
    removeDependency,
  };
};
