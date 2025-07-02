import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import {
    ArrowPathIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    EyeIcon,
    FolderIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

type ActivityAction =
  | 'create' | 'update' | 'delete' | 'view' | 'assign' | 'unassign'
  | 'login' | 'logout' | 'upload' | 'download' | 'comment' | 'invite'
  | 'archive' | 'restore' | 'complete' | 'reopen' | 'approve' | 'reject';

type ResourceType =
  | 'project' | 'task' | 'user' | 'calendar' | 'event' | 'comment'
  | 'attachment' | 'team' | 'role' | 'setting' | 'report';

interface ActivityLog {
  id: number;
  user_id: number;
  action: ActivityAction;
  resource_type: ResourceType;
  resource_id?: number;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  metadata?: {
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    additional_info?: Record<string, any>;
  };
  user: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  resource?: {
    id: number;
    name?: string;
    title?: string;
  };
}

interface ActivityFilters {
  user_id?: number;
  action?: ActivityAction;
  resource_type?: ResourceType;
  start_date?: string;
  end_date?: string;
  search?: string;
}

interface User {
  id: number;
  username: string;
  full_name: string;
  avatar_url?: string;
}

const Activity: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { getUserActivity, getUsers } = useUsers();

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ActivityFilters>({
    user_id: undefined,
    action: undefined,
    resource_type: undefined,
    start_date: '',
    end_date: '',
    search: '',
  });

  useEffect(() => {
    // Initialize filters from URL params
    const userIdParam = searchParams.get('user_id');
    const actionParam = searchParams.get('action');
    const resourceTypeParam = searchParams.get('resource_type');

    if (userIdParam || actionParam || resourceTypeParam) {
      setFilters(prev => ({
        ...prev,
        user_id: userIdParam ? parseInt(userIdParam) : undefined,
        action: (actionParam as ActivityAction) || undefined,
        resource_type: (resourceTypeParam as ResourceType) || undefined,
      }));
      setShowFilters(true);
    }

    fetchUsers();
    fetchActivities(true);
  }, []);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const usersData = await getUsers({ page_size: 100 });
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchActivities = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage = reset ? 1 : page;

      // If no specific user is selected and current user exists, show their activity
      const targetUserId = filters.user_id || currentUser?.id;

      if (!targetUserId) {
        throw new Error('No user selected');
      }

      const params = {
        ...filters,
        page_no: currentPage,
        page_size: 20,
      };

      const data = await getUserActivity(targetUserId, params);

      if (reset) {
        setActivities(data);
        setPage(2);
      } else {
        setActivities(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }

      setHasMore(data.length === 20);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load activity';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof ActivityFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchActivities(true);
  };

  const handleClearFilters = () => {
    setFilters({
      user_id: undefined,
      action: undefined,
      resource_type: undefined,
      start_date: '',
      end_date: '',
      search: '',
    });
    setPage(1);
    fetchActivities(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchActivities(false);
    }
  };

  const getActionIcon = (action: ActivityAction) => {
    switch (action) {
      case 'create':
        return PlusIcon;
      case 'update':
        return PencilIcon;
      case 'delete':
        return TrashIcon;
      case 'view':
        return EyeIcon;
      case 'login':
      case 'logout':
        return UserIcon;
      case 'complete':
        return CheckCircleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getActionColor = (action: ActivityAction) => {
    switch (action) {
      case 'create':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'update':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'delete':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'complete':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'login':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'logout':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getResourceIcon = (resourceType: ResourceType) => {
    switch (resourceType) {
      case 'project':
        return FolderIcon;
      case 'task':
        return DocumentTextIcon;
      case 'user':
        return UserIcon;
      case 'calendar':
      case 'event':
        return CalendarIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderActivityItem = (activity: ActivityLog) => {
    const ActionIcon = getActionIcon(activity.action);
    const ResourceIcon = getResourceIcon(activity.resource_type);
    const actionColor = getActionColor(activity.action);

    return (
      <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          {/* Action Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${actionColor}`}>
            <ActionIcon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.user.full_name}
              </span>
              <Badge variant="outline" className="text-xs">
                {activity.action}
              </Badge>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <ResourceIcon className="w-3 h-3" />
                <span>{activity.resource_type}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {activity.description}
            </p>

            {/* Resource Link */}
            {activity.resource && (
              <div className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {activity.resource.name || activity.resource.title}
              </div>
            )}

            {/* Metadata */}
            {activity.metadata?.additional_info && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <details className="group">
                  <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    View details
                  </summary>
                  <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                    {JSON.stringify(activity.metadata.additional_info, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Timestamp and IP */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>{formatTimeAgo(activity.created_at)}</span>
                {activity.ip_address && (
                  <span>IP: {activity.ip_address}</span>
                )}
              </div>
              <span>{new Date(activity.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* User Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {activity.user.avatar_url ? (
                <img
                  src={activity.user.avatar_url}
                  alt={`${activity.user.full_name}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {activity.user.full_name[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Activity Log
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Track user actions and system events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => fetchActivities(true)}
            disabled={loading}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filter Activities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User
              </label>
              <select
                value={filters.user_id || ''}
                onChange={(e) => handleFilterChange('user_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={usersLoading}
                title="User"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Action
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                title="Action"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="view">View</option>
                <option value="assign">Assign</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            {/* Resource Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resource Type
              </label>
              <select
                value={filters.resource_type || ''}
                onChange={(e) => handleFilterChange('resource_type', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                title="Resource Type"
              >
                <option value="">All Types</option>
                <option value="project">Project</option>
                <option value="task">Task</option>
                <option value="user">User</option>
                <option value="calendar">Calendar</option>
                <option value="event">Event</option>
                <option value="comment">Comment</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Description
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search activity descriptions..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center space-x-4 mt-6">
            <Button onClick={handleApplyFilters} disabled={loading}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear All
            </Button>
          </div>
        </Card>
      )}

      {/* Activity List */}
      <div className="space-y-4">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => fetchActivities(true)} />
        ) : activities.length === 0 ? (
          <Card className="p-12 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Activity Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No activities match your current filters.
            </p>
          </Card>
        ) : (
          <>
            {activities.map(renderActivityItem)}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Activity;
