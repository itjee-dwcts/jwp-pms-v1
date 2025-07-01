import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Task as ApiTask, useTasks } from '@/hooks/useTasks';
import {
  CalendarIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  TableCellsIcon,
  TagIcon,
  UserIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

type ViewMode = 'grid' | 'list' | 'table' | 'kanban';
type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Use the Task type from the API (useTasks hook)
type Task = ApiTask;

interface FilterOptions {
  status: TaskStatus | '';
  priority: TaskPriority | '';
  project_id: number | '';
  assignee_id: number | '';
  search: string;
}

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getTasks, deleteTask } = useTasks();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    priority: '',
    project_id: '',
    assignee_id: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    task: Task | null;
  }>({ isOpen: false, task: null });

  useEffect(() => {
    // Initialize filters from URL params
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');

    if (projectId || status) {
      setFilters(prev => ({
        ...prev,
        project_id: projectId ? parseInt(projectId) : '',
        status: (status as TaskStatus) || '',
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        project_id: filters.project_id || undefined,
        assignee_id: filters.assignee_id || undefined,
      };
      if (filters.search) {
        params.search = filters.search;
      }
      const data = await getTasks(params);
      setTasks(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      await deleteTask(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      toast.success(`Task "${task.title}" deleted successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      toast.error(errorMessage);
    } finally {
      setDeleteConfirm({ isOpen: false, task: null });
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[priority];
  };

  const isOverdue = (dueDate: string | null): boolean => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const renderTaskCard = (task: Task) => (
    <Card key={task.id} className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            to={`/tasks/${task.id}`}
            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          >
            {task.title}
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {task.description}
          </p>
        </div>
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm">
              <EllipsisVerticalIcon className="h-4 w-4" />
            </Button>
          }
          items={[
            {
              label: '상세 보기',
              onClick: () => navigate(`/tasks/${task.id}`),
            },
            {
              label: '수정',
              onClick: () => navigate(`/tasks/${task.id}/edit`),
            },
            { type: 'divider' },
            {
              label: '삭제',
              onClick: () => setDeleteConfirm({ isOpen: true, task }),
              className: 'text-red-600 dark:text-red-400',
            },
          ]}
        />
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Badge className={getStatusColor(task.status)}>
          {task.status.replace('_', ' ').toUpperCase()}
        </Badge>
        <Badge className={getPriorityColor(task.priority)}>
          {task.priority.toUpperCase()}
        </Badge>
        {isOverdue(task.due_date ?? null) && (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            기한 초과
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {/* Project */}
        <div className="flex items-center justify-between">
          <Link
            to={`/projects/${task.project.id}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {task.project.name}
          </Link>
        </div>

        {/* Due Date */}
        {task.due_date && (
          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
            <CalendarIcon className="h-4 w-4" />
            <span className={isOverdue(task.due_date) ? 'text-red-600 dark:text-red-400' : ''}>
              마감: {new Date(task.due_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Assignees */}
        {task.assignees.length > 0 && (
          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
            <UserIcon className="h-4 w-4" />
            <span>
              {task.assignees.length === 1 && task.assignees[0]
                ? `${task.assignees[0].full_name}`
                : `${task.assignees.length}명의 담당자`
              }
            </span>
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                className="text-xs"
                // If you want to use dynamic colors, you need to extend Badge to accept them or use a fixed set of classes
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag.name}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="default" className="text-xs">
                +{task.tags.length - 3}개 더보기
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {task.comments_count > 0 && (
              <span>{task.comments_count}개의 댓글</span>
            )}
            {task.attachments_count > 0 && (
              <span>{task.attachments_count}개의 파일</span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {new Date(task.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );

  const renderTaskTable = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                작업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                프로젝트
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                우선순위
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                마감일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                수정일
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">관리</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {task.title}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {task.description}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/projects/${task.project.id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {task.project.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority.toUpperCase()}
                    </Badge>
                    {isOverdue(task.due_date ?? null) && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {task.assignees.length > 0 && task.assignees[0]
                    ? task.assignees[0].full_name
                    : '미지정'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {task.due_date ? (
                    <span className={isOverdue(task.due_date) ? 'text-red-600 dark:text-red-400' : ''}>
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(task.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <DropdownMenu
                    trigger={
                      <Button variant="ghost" size="sm">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </Button>
                    }
                    items={[
                      {
                        label: '상세 보기',
                        onClick: () => navigate(`/tasks/${task.id}`),
                      },
                      {
                        label: '수정',
                        onClick: () => navigate(`/tasks/${task.id}/edit`),
                      },
                      { type: 'divider' },
                      {
                        label: '삭제',
                        onClick: () => setDeleteConfirm({ isOpen: true, task }),
                        className: 'text-red-600 dark:text-red-400',
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorMessage message={error} onRetry={fetchTasks} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            작업
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            작업을 관리하고 추적하세요
          </p>
        </div>
        <Button onClick={() => navigate('/tasks/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          새 작업
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="작업 검색..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-blue-50 dark:bg-blue-900' : ''}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            필터
          </Button>

          {/* View Mode Toggles */}
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-none ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-none ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            >
              <ViewColumnsIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={`rounded-none ${viewMode === 'table' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={`rounded-none ${viewMode === 'kanban' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            >
              Kanban
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상태
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as TaskStatus | '' }))}
                title="상태"
              >
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                우선순위
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as TaskPriority | '' }))}
                title="우선순위"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                프로젝트
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={filters.project_id}
                onChange={(e) => setFilters(prev => ({ ...prev, project_id: e.target.value ? parseInt(e.target.value) : '' }))}
                title="프로젝트"
              >
                <option value="">All Projects</option>
                {/* TODO: Load projects from API */}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ status: '', priority: '', project_id: '', assignee_id: '', search: '' })}
                className="w-full"
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tasks Content */}
      {viewMode === 'kanban' ? (
        <KanbanBoard tasks={tasks} onTaskUpdate={fetchTasks} />
      ) : tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <ClockIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            작업이 없습니다.
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filters.search || filters.status || filters.priority || filters.project_id
              ? "No tasks match your current filters"
              : "Get started by creating your first task"
            }
          </p>
          {!filters.search && !filters.status && !filters.priority && !filters.project_id && (
            <Button onClick={() => navigate('/tasks/new')}>
              <PlusIcon className="h-4 w-4 mr-2" />
              작업 생성
            </Button>
          )}
        </Card>
      ) : (
        <>
          {viewMode === 'table' ? (
            renderTaskTable()
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {tasks.map(renderTaskCard)}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, task: null })}
        onConfirm={() => deleteConfirm.task && handleDeleteTask(deleteConfirm.task)}
        title="Delete Task"
        message={`"${deleteConfirm.task?.title}"작업을 삭제하겠습니까? 삭제 후 복구할 수 없습니다.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Tasks;
