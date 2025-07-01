import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          {/* Error Icon */}
          <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>

          {/* Error Code */}
          <h1 className="text-9xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>

          {/* Error Message */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <Card className="p-6">
          <div className="space-y-4">
            <Button
              onClick={() => navigate(-1)}
              className="w-full"
              variant="outline"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Go Back
            </Button>

            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>

            <Button
              onClick={() => navigate('/search')}
              className="w-full"
              variant="outline"
            >
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </Card>

        {/* Help Links */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-4">Need help? Try these popular pages:</p>
          <div className="space-y-2">
            <Link
              to="/projects"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Projects
            </Link>
            <Link
              to="/tasks"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Tasks
            </Link>
            <Link
              to="/calendar"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Calendar
            </Link>
            <Link
              to="/profile"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Profile
            </Link>
          </div>
        </div>

        {/* Error Details for Development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700">
            <div className="text-left">
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Development Info:
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Current URL: {window.location.pathname}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Timestamp: {new Date().toISOString()}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotFound;
