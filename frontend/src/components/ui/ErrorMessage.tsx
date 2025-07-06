import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import Button from './Button';

export interface ErrorMessageProps {
  /**
   * The error message to display
   */
  message: string;

  /**
   * Optional detailed error description
   */
  description?: string | React.ReactNode;

  /**
   * Error type/severity level
   */
  type?: 'error' | 'warning' | 'info';

  /**
   * Optional retry function to call when retry button is clicked
   */
  onRetry?: (() => void) | undefined;

  /**
   * Custom retry button text
   */
  retryText?: string;

  /**
   * Optional dismiss function
   */
  onDismiss?: (() => void) | undefined;

  /**
   * Whether to show the error icon
   */
  showIcon?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to show as a compact inline error
   */
  inline?: boolean;

  /**
   * Custom action buttons
   */
  actions?: React.ReactNode;
}

/**
 * ErrorMessage Component
 *
 * A flexible error message component that displays error information
 * with optional retry and dismiss functionality.
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  description,
  type = 'error',
  onRetry,
  retryText = 'Try Again',
  onDismiss,
  showIcon = true,
  size = 'md',
  className = '',
  inline = false,
  actions,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return ExclamationTriangleIcon;
      case 'info':
        return InformationCircleIcon;
      case 'error':
      default:
        return XCircleIcon;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-400 dark:text-yellow-500',
          title: 'text-yellow-800 dark:text-yellow-200',
          description: 'text-yellow-700 dark:text-yellow-300',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-400 dark:text-blue-500',
          title: 'text-blue-800 dark:text-blue-200',
          description: 'text-blue-700 dark:text-blue-300',
        };
      case 'error':
      default:
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-400 dark:text-red-500',
          title: 'text-red-800 dark:text-red-200',
          description: 'text-red-700 dark:text-red-300',
        };
    }
  };

  const getSizes = () => {
    switch (size) {
      case 'sm':
        return {
          padding: inline ? 'p-3' : 'p-4',
          iconSize: 'h-4 w-4',
          titleSize: 'text-sm',
          descriptionSize: 'text-xs',
          spacing: 'space-y-2',
        };
      case 'lg':
        return {
          padding: inline ? 'p-5' : 'p-6',
          iconSize: 'h-7 w-7',
          titleSize: 'text-lg',
          descriptionSize: 'text-base',
          spacing: 'space-y-4',
        };
      case 'md':
      default:
        return {
          padding: inline ? 'p-4' : 'p-5',
          iconSize: 'h-5 w-5',
          titleSize: 'text-base',
          descriptionSize: 'text-sm',
          spacing: 'space-y-3',
        };
    }
  };

  const Icon = getIcon();
  const colors = getColors();
  const sizes = getSizes();

  const baseClasses = `
    ${colors.bg}
    ${colors.border}
    ${sizes.padding}
    border
    rounded-lg
    ${inline ? 'inline-flex items-center space-x-2' : sizes.spacing}
    ${className}
  `.trim();

  if (inline) {
    return (
      <div className={baseClasses}>
        {showIcon && (
          <Icon className={`${sizes.iconSize} ${colors.icon} flex-shrink-0`} />
        )}
        <div>
          <span className={`font-medium ${colors.title} ${sizes.titleSize}`}>
            {message}
          </span>
          {description && (
            <span className={`ml-2 ${colors.description} ${sizes.descriptionSize}`}>
              {description}
            </span>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-auto -mx-1.5 -my-1.5 ${colors.title} hover:${colors.bg} focus:${colors.bg} p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${colors.bg} focus:ring-${colors.border}`}
          >
            <span className="sr-only">Dismiss</span>
            <XCircleIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <Icon className={`${sizes.iconSize} ${colors.icon}`} />
          </div>
        )}
        <div className={showIcon ? 'ml-3 flex-1' : 'flex-1'}>
          <h3 className={`font-medium ${colors.title} ${sizes.titleSize}`}>
            {message}
          </h3>
          {description && (
            <div className={`mt-2 ${colors.description} ${sizes.descriptionSize}`}>
              <p>{description}</p>
            </div>
          )}

          {(onRetry || actions || onDismiss) && (
            <div className="mt-4">
              <div className="flex space-x-3">
                {onRetry && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onRetry}
                    className={`
                      ${type === 'error' ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/50' : ''}
                      ${type === 'warning' ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/50' : ''}
                      ${type === 'info' ? 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/50' : ''}
                    `}
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    {retryText}
                  </Button>
                )}

                {actions}

                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className={`
                      ${type === 'error' ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50' : ''}
                      ${type === 'warning' ? 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/50' : ''}
                      ${type === 'info' ? 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/50' : ''}
                    `}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Preset error message components for common use cases
 */

export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorMessage
    message="Network Error"
    description="Unable to connect to the server. Please check your internet connection and try again."
    onRetry={onRetry}
    type="error"
  />
);

export const NotFoundError: React.FC<{ resource?: string; onRetry?: () => void }> = ({
  resource = 'resource',
  onRetry
}) => (
  <ErrorMessage
    message={`${resource.charAt(0).toUpperCase() + resource.slice(1)} Not Found`}
    description={`The ${resource} you're looking for doesn't exist or has been removed.`}
    onRetry={onRetry}
    type="warning"
  />
);

export const PermissionError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorMessage
    message="Access Denied"
    description="You don't have permission to access this resource. Contact your administrator if you think this is an error."
    onRetry={onRetry}
    type="warning"
  />
);

export const ValidationError: React.FC<{ errors: string[]; onDismiss?: () => void }> = ({
  errors,
  onDismiss
}) => (
  <ErrorMessage
    message="Validation Error"
    description={
      <ul className="list-disc list-inside space-y-1">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    }
    onDismiss={onDismiss}
    type="warning"
  />
);

export const GenericError: React.FC<{
  error?: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({
  error,
  onRetry,
  onDismiss
}) => {
  const message = error instanceof Error ? error.message : error || 'An unexpected error occurred';

  return (
    <ErrorMessage
      message="Something went wrong"
      description={message}
      onRetry={onRetry}
      onDismiss={onDismiss}
      type="error"
    />
  );
};

export default ErrorMessage;
