import classNames from 'classnames';
import React from 'react';

interface ProgressBarProps {
  /**
   * The percentage of completion, from 0 to 100.
   */
  percentage: number;

  /**
   * The size (height) of the progress bar.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * The color of the progress bar, using Tailwind CSS background color classes.
   * @default 'bg-blue-600'
   */
  color?: string;

  /**
   * Additional CSS classes for the container element.
   */
  className?: string;
}

/**
 * ProgressBar Component
 *
 * A simple, visual progress bar to indicate completion status.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  size = 'md',
  color = 'bg-blue-600',
  className = '',
}) => {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
  };

  const containerClasses = classNames(
    'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
    sizeClasses[size],
    className
  );

  const barClasses = classNames(
    'h-full rounded-full transition-all duration-300 ease-in-out',
    color
  );

  return (
    <div
      className={containerClasses}
      role="progressbar"
      aria-valuenow={clampedPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      title={`${Math.round(clampedPercentage)}% complete`}
    >
      <div
        className={barClasses}
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;
