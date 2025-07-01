import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  owner: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  members: Array<{
    id: number;
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
    role: string;
    joined_at: string;
  }>;
  tasks: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date: string;
    assignees: Array<{
      id: number;
      first_name: string;
      last_name: string;
    }>;
  }>;
  comments: Array<{
    id: number;
    content: string;
    created_at: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
    };
  }>;
  attachments: Array<{
    id: number;
    file_name: string;
    file_size: number;
    uploaded_at: string;
    uploader: {
      id: number;
      first_name: string;
      last_name: string;
    };
  }>;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, deleteProject } = useProjects();
  const { getTasks } = useTasks();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'comments' | 'files'>('overview');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProject(parseInt(id!));
      setProject(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    try {
      await deleteProject(project.id);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      toast.error(errorMessage);
    } finally {
      setDeleteConfirm(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getProgressPercentage = (): number => {
    if (!project || project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(task => task.status === 'done').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorMessage message={error || 'Project not found'} onRetry={fetchProject} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Created by {project.owner.first_name} {project.owner.last_name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/projects/${project.id}/edit`)}
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu
            trigger={
              <Button variant="ghost">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
            }
            items={[
              {
                label: 'Add Member',
                onClick: () => navigate(`/projects/${project.id}/members/add`),
                icon: UserPlusIcon,
              },
              {
                label: 'Export',
                onClick: () => toast.info('Export feature coming soon'),
              },
              { type: 'divider' },
              {
                label: 'Delete Project',
                onClick: () => setDeleteConfirm(true),
                className: 'text-red-600 dark:text-red-400',
                icon: TrashIcon,
              },
            ]}
          />
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority.toUpperCase()}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
              <div className="mt-2">
                <ProgressBar percentage={getProgressPercentage()} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Team</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.members.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
            { id: 'tasks', label: `Tasks (${project.tasks.length})`, icon: ClockIcon },
            { id: 'comments', label: `Comments (${project.comments.length})`, icon: ChatBubbleLeftIcon },
            { id: 'files', label: `Files (${project.attachments.length})`, icon: PaperClipIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {project.description || 'No description provided.'}
              </p>
            </Card>

            {/* Recent Tasks */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Tasks
                </h3>
                <Link
                  to={`/tasks?project_id=${project.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {project.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {task.title}
                      </Link>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {task.assignees.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {task.assignees[0].first_name} {task.assignees[0].last_name}
                      </div>
                    )}
                  </div>
                ))}
                {project.tasks.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No tasks yet
                  </p>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Project Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Project Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Start: {new Date(project.start_date).toLocaleDateString()}
                  </span>
                </div>
                {project.end_date && (
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      End: {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Updated: {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Team Members */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Team Members
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/projects/${project.id}/members/add`)}
                >
                  <UserPlusIcon className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      {member.user.avatar_url ? (
                        <img
                          src={member.user.avatar_url}
                          alt={`${member.user.first_name} ${member.user.last_name}`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {member.user.first_name[0]}{member.user.last_name[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.user.first_name} {member.user.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Project Tasks
            </h3>
            <Button onClick={() => navigate(`/tasks/new?project_id=${project.id}`)}>
              <ClockIcon className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
          <div className="space-y-4">
            {project.tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {task.title}
                  </Link>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority.toUpperCase()}
                    </Badge>
                    {task.due_date && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {task.assignees.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {task.assignees.map(assignee =>
                      `${assignee.first_name} ${assignee.last_name}`
                    ).join(', ')}
                  </div>
                )}
              </div>
            ))}
            {project.tasks.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No tasks created yet. Create your first task to get started.
              </p>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'comments' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Comments
          </h3>
          <div className="space-y-4">
            {project.comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {comment.user.first_name[0]}{comment.user.last_name[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.user.first_name} {comment.user.last_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
            {project.comments.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No comments yet. Be the first to add a comment.
              </p>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'files' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Attachments
            </h3>
            <Button variant="outline">
              <PaperClipIcon className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
          <div className="space-y-4">
            {project.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <PaperClipIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {attachment.file_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.file_size)} •
                      Uploaded by {attachment.uploader.first_name} {attachment.uploader.last_name} •
                      {new Date(attachment.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </div>
            ))}
            {project.attachments.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No files uploaded yet.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone and will also delete all associated tasks and comments.`}
        confirmText="Delete Project"
        confirmVariant="danger"
      />
    </div>
  );
};

export default ProjectDetail;
