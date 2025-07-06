import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useRef } from 'react';
import Button from './Button';

export interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Function to call when the dialog should be closed
   */
  onClose: () => void;

  /**
   * Function to call when the user confirms the action
   */
  onConfirm: () => void;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog message/content
   */
  message: string | React.ReactNode;

  /**
   * Text for the confirm button
   */
  confirmText?: string;

  /**
   * Text for the cancel button
   */
  cancelText?: string;

  /**
   * Variant of the confirm button
   */
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';

  /**
   * Dialog type/severity level
   */
  type?: 'warning' | 'danger' | 'info' | 'success' | 'question';

  /**
   * Whether to show the dialog icon
   */
  showIcon?: boolean;

  /**
   * Whether the confirm action is loading
   */
  loading?: boolean | undefined;

  /**
   * Whether to disable the confirm button
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to close on overlay click
   */
  closeOnOverlayClick?: boolean;

  /**
   * Whether to close on escape key
   */
  closeOnEscape?: boolean;

  /**
   * Custom footer content
   */
  footer?: React.ReactNode;

  /**
   * Dialog size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * ConfirmDialog Component
 *
 * A modal dialog for confirming user actions with customizable appearance
 * and behavior. Supports different types (warning, danger, etc.) and
 * provides accessibility features.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  type = 'warning',
  showIcon = true,
  loading = false,
  disabled = false,
  className = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  size = 'md',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button when dialog opens
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle confirm action
  const handleConfirm = () => {
    if (!loading && !disabled) {
      onConfirm();
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return ExclamationTriangleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'success':
        return CheckCircleIcon;
      case 'info':
        return InformationCircleIcon;
      case 'question':
        return QuestionMarkCircleIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  // Get colors based on type
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900',
        };
      case 'warning':
        return {
          icon: 'text-yellow-600 dark:text-yellow-400',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900',
        };
      case 'success':
        return {
          icon: 'text-green-600 dark:text-green-400',
          iconBg: 'bg-green-100 dark:bg-green-900',
        };
      case 'info':
        return {
          icon: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-900',
        };
      case 'question':
        return {
          icon: 'text-purple-600 dark:text-purple-400',
          iconBg: 'bg-purple-100 dark:bg-purple-900',
        };
      default:
        return {
          icon: 'text-gray-600 dark:text-gray-400',
          iconBg: 'bg-gray-100 dark:bg-gray-900',
        };
    }
  };

  // Get confirm button variant
  const getConfirmButtonVariant = () => {
    if (confirmVariant === 'danger') return 'danger';
    if (confirmVariant === 'primary') return 'primary';
    if (confirmVariant === 'warning') return 'outline';
    if (confirmVariant === 'success') return 'default';
    return 'default';
  };

  // Get dialog size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      default:
        return 'max-w-md';
    }
  };

  const Icon = getIcon();
  const colors = getColors();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={dialogRef}
          className={`
            relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800
            text-left shadow-xl transition-all w-full ${getSizeClasses()} ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              {showIcon && (
                <div className={`
                  mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center
                  rounded-full ${colors.iconBg} sm:mx-0 sm:h-10 sm:w-10
                `}>
                  <Icon className={`h-6 w-6 ${colors.icon}`} aria-hidden="true" />
                </div>
              )}

              {/* Content */}
              <div className={`mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left ${showIcon ? '' : 'sm:ml-0'}`}>
                <h3
                  id="dialog-title"
                  className="text-base font-semibold leading-6 text-gray-900 dark:text-white"
                >
                  {title}
                </h3>
                <div className="mt-2">
                  <div
                    id="dialog-description"
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    {typeof message === 'string' ? (
                      <p>{message}</p>
                    ) : (
                      message
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {footer || (
              <>
                <Button
                  ref={confirmButtonRef}
                  onClick={handleConfirm}
                  disabled={loading || disabled}
                  variant={getConfirmButtonVariant()}
                  className="w-full justify-center sm:ml-3 sm:w-auto"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Loading...
                    </>
                  ) : (
                    confirmText
                  )}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={onClose}
                  disabled={loading}
                  className="mt-3 w-full justify-center sm:mt-0 sm:w-auto"
                >
                  {cancelText}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Preset confirm dialog components for common use cases
 */

export const DeleteConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, itemType = 'item', loading }) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Delete ${itemType}`}
    message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
    confirmText="Delete"
    confirmVariant="danger"
    type="danger"
    loading={loading}
  />
);

export const DiscardChangesDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, loading }) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Discard Changes"
    message="You have unsaved changes. Are you sure you want to discard them?"
    confirmText="Discard"
    confirmVariant="warning"
    type="warning"
    loading={loading}
  />
);

export const LogoutConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, loading }) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Sign Out"
    message="Are you sure you want to sign out?"
    confirmText="Sign Out"
    confirmVariant="primary"
    type="question"
    loading={loading}
  />
);

export const ArchiveConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, itemType = 'item', loading }) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Archive ${itemType}`}
    message={`Are you sure you want to archive "${itemName}"? You can restore it later from the archived items.`}
    confirmText="Archive"
    confirmVariant="warning"
    type="warning"
    loading={loading}
  />
);

export const PublishConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, itemType = 'item', loading }) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Publish ${itemType}`}
    message={`Are you sure you want to publish "${itemName}"? It will be visible to all team members.`}
    confirmText="Publish"
    confirmVariant="success"
    type="success"
    loading={loading}
  />
);

export default ConfirmDialog;
