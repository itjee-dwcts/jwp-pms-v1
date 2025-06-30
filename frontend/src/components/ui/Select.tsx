import classNames from 'classnames';
import React, { forwardRef } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    const selectClasses = classNames(
      'block w-full rounded-md border-gray-300 shadow-sm transition-colors duration-200',
      'focus:border-primary-500 focus:ring-primary-500',
      'dark:bg-gray-700 dark:border-gray-600 dark:text-white',
      'dark:focus:border-primary-400 dark:focus:ring-primary-400',
      {
        'border-red-300 focus:border-red-500 focus:ring-red-500': error,
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

        <select ref={ref} className={selectClasses} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
