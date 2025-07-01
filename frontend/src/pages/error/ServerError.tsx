import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    ChatBubbleLeftEllipsisIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    HomeIcon,
    ServerIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface ErrorDetails {
  statusCode?: number;
  message?: string;
  timestamp?: string;
  path?: string;
  error?: Error;
}

const ServerError: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [timeUntilRetry, setTimeUntilRetry] = useState(0);

  // Extract error details from location state or set defaults
  const errorDetails: ErrorDetails = location.state?.errorDetails || {
    statusCode: 500,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: location.pathname,
  };

  const isMaintenanceMode = errorDetails.statusCode === 503;
  const isNetworkError = errorDetails.message?.toLowerCase().includes('network');

  useEffect(() => {
    // Auto-retry for network errors after a delay
    if (isNetworkError && retryCount < 3) {
      const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
      setTimeUntilRetry(retryDelay / 1000);

      const interval = setInterval(() => {
        setTimeUntilRetry((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleRetry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [retryCount, isNetworkError]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Wait a moment for the retry animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload the current page
      window.location.reload();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorIcon = () => {
    if (isMaintenanceMode) return ServerIcon;
    if (isNetworkError) return ArrowPathIcon;
    return ExclamationTriangleIcon;
  };

  const getErrorTitle = () => {
    switch (errorDetails.statusCode) {
      case 500:
        return 'Internal Server Error';
      case 502:
        return 'Bad Gateway';
      case 503:
        return 'Service Unavailable';
      case 504:
        return 'Gateway Timeout';
      default:
        return 'Server Error';
    }
  };

  const getErrorMessage = () => {
    if (isMaintenanceMode) {
      return 'We\'re currently performing scheduled maintenance. Please check back in a few minutes.';
    }

    if (isNetworkError) {
      return 'Unable to connect to our servers. Please check your internet connection and try again.';
    }

    switch (errorDetails.statusCode) {
      case 500:
        return 'Something went wrong on our end. Our team has been notified and is working to fix the issue.';
      case 502:
        return 'We\'re experiencing connectivity issues with our servers. Please try again in a moment.';
      case 503:
        return 'Our service is temporarily unavailable. We\'re working to restore it as quickly as possible.';
      case 504:
        return 'The server took too long to respond. Please try again.';
      default:
        return errorDetails.message || 'An unexpected server error occurred. Please try again later.';
    }
  };

  const getErrorColor = () => {
    if (isMaintenanceMode) return 'blue';
    if (isNetworkError) return 'yellow';
    return 'red';
  };

  const ErrorIcon = getErrorIcon();
  const errorColor = getErrorColor();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div>
          {/* Error Icon */}
          <div className={`mx-auto w-24 h-24 bg-${errorColor}-100 dark:bg-${errorColor}-900 rounded-full flex items-center justify-center mb-8`}>
            <ErrorIcon className={`w-12 h-12 text-${errorColor}-600 dark:text-${errorColor}-400`} />
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {errorDetails.statusCode}
          </h1>

          {/* Error Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {getErrorTitle()}
          </h2>

          {/* Error Message */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {getErrorMessage()}
          </p>
        </div>

        {/* Auto-retry Counter for Network Errors */}
        {isNetworkError && timeUntilRetry > 0 && retryCount < 3 && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-center space-x-2 text-yellow-800 dark:text-yellow-200">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm">
                Auto-retrying in {timeUntilRetry} seconds...
              </span>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Retry Button */}
            <Button
              onClick={handleRetry}
              disabled={isRetrying || (timeUntilRetry > 0 && retryCount < 3)}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Retrying...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  {timeUntilRetry > 0 ? `Retry in ${timeUntilRetry}s` : 'Try Again'}
                </>
              )}
            </Button>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>

            {/* Contact Support */}
            <Button
              onClick={() => navigate('/help')}
              variant="ghost"
              className="w-full"
            >
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </Card>

        {/* Status Information */}
        {isMaintenanceMode && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="text-blue-800 dark:text-blue-200">
              <h4 className="font-medium mb-2">Scheduled Maintenance</h4>
              <p className="text-sm">
                We're performing routine maintenance to improve our service.
                Expected completion time: ~30 minutes.
              </p>
              <p className="text-xs mt-2 opacity-75">
                Follow our status page for real-time updates.
              </p>
            </div>
          </Card>
        )}

        {/* Error Details for Development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="text-left">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Development Info:
              </h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Status:</strong> {errorDetails.statusCode}</p>
                <p><strong>Path:</strong> {errorDetails.path}</p>
                <p><strong>Timestamp:</strong> {errorDetails.timestamp}</p>
                <p><strong>Retry Count:</strong> {retryCount}</p>
                {errorDetails.error && (
                  <div>
                    <strong>Error Details:</strong>
                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                      {errorDetails.error.stack || errorDetails.error.message}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Help Links */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-4">If the problem persists, try these options:</p>
          <div className="space-y-2">
            <Link
              to="/help"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Help & Support
            </Link>
            <a
              href="https://status.example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Service Status Page
            </a>
            <Link
              to="/contact"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Contact Us
            </Link>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-xs text-gray-500 dark:text-gray-500">
          <p>
            Error ID: {errorDetails.timestamp?.slice(-8) || 'N/A'} •
            We apologize for the inconvenience
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
