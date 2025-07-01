import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useProjects } from '@/hooks/useProjects';
import {
  CalendarIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  TableCellsIcon,
  UserGroupIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

type ViewMode = 'grid' | 'list' | 'table';
type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  task_count: number;
  completed_task_count: number;
  owner: {
    id: number;
    username: string;
    full_name: string;
  };
}

interface FilterOptions {
  status: ProjectStatus | '';
  priority: ProjectPriority | '';
  search: string;
}

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { getProjects, deleteProject } = useProjects();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    priority: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    project: Project | null;
  }>({ isOpen: false, project: null });

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        search: filters.search ?? '',
      });
      setProjects(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject(project.id);
      setProjects(prev => prev.filter(p => p.id !== project.id));
      toast.success(`Project "${project.name}" deleted successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      toast.error(errorMessage);
    } finally {
      setDeleteConfirm({ isOpen: false, project: null });
    }
  };

  const getStatusColor = (status: ProjectStatus): string => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: ProjectPriority): string => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[priority];
  };

  const getProgressPercentage = (project: Project): number => {
    if (project.task_count === 0) return 0;
    return Math.round((project.completed_task_count / project.task_count) * 100);
  };

  const filteredProjects = projects.filter(project => {
    if (filters.status && project.status !== filters.status) return false;
    if (filters.priority && project.priority !== filters.priority) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const renderProjectCard = (project: Project) => (
    <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            to={`/projects/${project.id}`}
            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          >
            {project.name}
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {project.description}
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
              label: 'View Details',
              onClick: () => navigate(`/projects/${project.id}`),
            },
            {
              label: 'Edit',
              onClick: () => navigate(`/projects/${project.id}/edit`),
            },
            { type: 'divider' },
            {
              label: 'Delete',
              onClick: () => setDeleteConfirm({ isOpen: true, project }),
              className: 'text-red-600 dark:text-red-400',
            },
          ]}
        />
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Badge className={getStatusColor(project.status)}>
          {project.status.replace('_', ' ').toUpperCase()}
        </Badge>
        <Badge className={getPriorityColor(project.priority)}>
          {project.priority.toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {getProgressPercentage(project)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage(project)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <UserGroupIcon className="h-4 w-4" />
            <span>{project.member_count} members</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>{project.task_count} tasks</span>
          </div>
        </div>

        {/* Dates */}
        {project.start_date && (
          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {new Date(project.start_date).toLocaleDateString()} - {' '}
              {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
            </span>
          </div>
        )}

        {/* Owner */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Owner: {project.owner.full_name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {new Date(project.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );

  const renderProjectTable = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Updated
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {project.name}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {project.description}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${getProgressPercentage(project)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {getProgressPercentage(project)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {project.member_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {project.owner.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(project.updated_at).toLocaleDateString()}
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
                        label: 'View Details',
                        onClick: () => navigate(`/projects/${project.id}`),
                      },
                      {
                        label: 'Edit',
                        onClick: () => navigate(`/projects/${project.id}/edit`),
                      },
                      { type: 'divider' },
                      {
                        label: 'Delete',
                        onClick: () => setDeleteConfirm({ isOpen: true, project }),
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
        <ErrorMessage message={error} onRetry={fetchProjects} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage and track your projects
          </p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Project
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
              placeholder="Search projects..."
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
            Filters
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
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as ProjectStatus | '' }))}
                title="Status"
              >
                <option value="">All Statuses</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as ProjectPriority | '' }))}
                title="Priority"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ status: '', priority: '', search: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Projects Content */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Squares2X2Icon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {projects.length === 0
              ? "Get started by creating your first project"
              : "No projects match your current filters"
            }
          </p>
          {projects.length === 0 && (
            <Button onClick={() => navigate('/projects/new')}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </Card>
      ) : (
        <>
          {viewMode === 'table' ? (
            renderProjectTable()
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {filteredProjects.map(renderProjectCard)}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, project: null })}
        onConfirm={() => deleteConfirm.project && handleDeleteProject(deleteConfirm.project)}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm.project?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Projects;
