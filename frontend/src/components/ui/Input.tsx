import classNames from 'classnames';
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, className, ...props }, ref) => {
    const inputClasses = classNames(
      'block w-full rounded-md border-gray-300 shadow-sm transition-colors duration-200',
      'focus:border-primary-500 focus:ring-primary-500',
      'dark:bg-gray-700 dark:border-gray-600 dark:text-white',
      'dark:focus:border-primary-400 dark:focus:ring-primary-400',
      {
        'border-red-300 focus:border-red-500 focus:ring-red-500': error,
        'pl-10': leftIcon,
        'pr-10': rightIcon,
      },
      className
    );

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {leftIcon}
              </div>
            </div>
          )}

          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="h-5 w-5 text-gray-400">
                {rightIcon}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {helper && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
