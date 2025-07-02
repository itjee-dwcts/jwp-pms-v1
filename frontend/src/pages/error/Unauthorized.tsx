import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  HomeIcon,
  LockClosedIcon,
  ShieldExclamationIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface UnauthorizedDetails {
  reason?: 'not_authenticated' | 'insufficient_permissions' | 'session_expired' | 'account_disabled' | 'ip_restricted';
  requiredRole?: string;
  requiredPermissions?: string[];
  resource?: string;
  action?: string;
  message?: string;
  redirectUrl?: string;
}

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [countdown, setCountdown] = useState(10);

  // Extract unauthorized details from location state or set defaults
  const details: UnauthorizedDetails = location.state?.unauthorizedDetails || {
    reason: isAuthenticated ? 'insufficient_permissions' : 'not_authenticated',
    resource: 'this resource',
    action: 'access',
  };

  const redirectUrl = details.redirectUrl || location.state?.from?.pathname || '/dashboard';

  // Auto-redirect countdown for session expired
  useEffect(() => {
    if (details.reason === 'session_expired') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleLogin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [details.reason]);

  const handleLogin = () => {
    navigate('/login', {
      state: {
        from: { pathname: redirectUrl },
        message: 'Please log in to continue'
      }
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', {
        state: {
          message: 'You have been logged out. Please log in again.'
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const getReasonDetails = () => {
    switch (details.reason) {
      case 'not_authenticated':
        return {
          title: 'Authentication Required',
          icon: UserIcon,
          color: 'blue',
          message: 'You need to log in to access this page.',
          suggestion: 'Please sign in with your account credentials.',
          showLogin: true,
        };

      case 'session_expired':
        return {
          title: 'Session Expired',
          icon: ClockIcon,
          color: 'yellow',
          message: 'Your session has expired for security reasons.',
          suggestion: 'You will be redirected to the login page automatically.',
          showLogin: true,
          showCountdown: true,
        };

      case 'insufficient_permissions':
        return {
          title: 'Access Denied',
          icon: ShieldExclamationIcon,
          color: 'red',
          message: `You don't have permission to ${details.action} ${details.resource}.`,
          suggestion: 'Contact your administrator if you believe this is an error.',
          showContactSupport: true,
        };

      case 'account_disabled':
        return {
          title: 'Account Disabled',
          icon: LockClosedIcon,
          color: 'red',
          message: 'Your account has been disabled.',
          suggestion: 'Please contact support to reactivate your account.',
          showContactSupport: true,
        };

      case 'ip_restricted':
        return {
          title: 'IP Address Restricted',
          icon: ShieldExclamationIcon,
          color: 'orange',
          message: 'Access from your current IP address is not allowed.',
          suggestion: 'Please contact your administrator to whitelist your IP address.',
          showContactSupport: true,
        };

      default:
        return {
          title: 'Access Denied',
          icon: LockClosedIcon,
          color: 'red',
          message: details.message || 'You are not authorized to access this resource.',
          suggestion: 'Please check your permissions or contact support.',
          showContactSupport: true,
        };
    }
  };

  const reasonDetails = getReasonDetails();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          {/* Error Icon */}
          <div className={`mx-auto w-24 h-24 bg-${reasonDetails.color}-100 dark:bg-${reasonDetails.color}-900 rounded-full flex items-center justify-center mb-8`}>
            <reasonDetails.icon className={`w-12 h-12 text-${reasonDetails.color}-600 dark:text-${reasonDetails.color}-400`} />
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            401
          </h1>

          {/* Error Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {reasonDetails.title}
          </h2>

          {/* Error Message */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            {reasonDetails.message}
          </p>

          {/* Suggestion */}
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            {reasonDetails.suggestion}
          </p>
        </div>

        {/* User Info Card (if authenticated) */}
        {user && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Signed in as: {user.full_name}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {user.email}
                </p>
              </div>
              {user.role && (
                <Badge variant="default" className="text-blue-700 border-blue-300">
                  {user.role}
                </Badge>
              )}
            </div>
          </Card>
        )}

        {/* Required Permissions Info */}
        {details.requiredRole || details.requiredPermissions ? (
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Required Access:
            </h4>
            <div className="space-y-2">
              {details.requiredRole && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Role:</span>
                  <Badge variant="default">{details.requiredRole}</Badge>
                </div>
              )}
              {details.requiredPermissions && details.requiredPermissions.length > 0 && (
                <div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                    Permissions:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {details.requiredPermissions.map((permission, index) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : null}

        {/* Countdown for Session Expired */}
        {reasonDetails.showCountdown && countdown > 0 && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-center space-x-2 text-yellow-800 dark:text-yellow-200">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm">
                Redirecting to login in {countdown} seconds...
              </span>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Primary Action */}
            {reasonDetails.showLogin && (
              <Button
                onClick={handleLogin}
                className="w-full"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                {user ? 'Sign In as Different User' : 'Sign In'}
              </Button>
            )}

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full"
              >
                <ArrowLeftIcon className="w-4 w-4 mr-2" />
                Go Back
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>

            {/* Logout (if authenticated) */}
            {user && (
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-gray-600 dark:text-gray-400"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}

            {/* Contact Support */}
            {reasonDetails.showContactSupport && (
              <Button
                onClick={() => navigate('/help')}
                variant="ghost"
                className="w-full"
              >
                <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            )}
          </div>
        </Card>

        {/* Help Links */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-4">Need help? Try these resources:</p>
          <div className="space-y-2">
            <Link
              to="/help"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Help Center
            </Link>
            <Link
              to="/help/permissions"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Understanding Permissions
            </Link>
            <Link
              to="/contact"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Contact Administrator
            </Link>
            {details.reason === 'account_disabled' && (
              <Link
                to="/help/account-recovery"
                className="block text-blue-600 dark:text-blue-400 hover:underline"
              >
                → Account Recovery
              </Link>
            )}
          </div>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="text-left">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Development Info:
              </h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Reason:</strong> {details.reason}</p>
                <p><strong>Resource:</strong> {details.resource}</p>
                <p><strong>Action:</strong> {details.action}</p>
                <p><strong>Current Path:</strong> {location.pathname}</p>
                <p><strong>Redirect URL:</strong> {redirectUrl}</p>
                {details.requiredRole && (
                  <p><strong>Required Role:</strong> {details.requiredRole}</p>
                )}
                {details.requiredPermissions && (
                  <p><strong>Required Permissions:</strong> {details.requiredPermissions.join(', ')}</p>
                )}
                {user && (
                  <p><strong>User Role:</strong> {user.role || 'None'}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Footer Message */}
        <div className="text-xs text-gray-500 dark:text-gray-500">
          <p>
            Access denied at {new Date().toLocaleTimeString()} •
            If you believe this is an error, please contact support
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
