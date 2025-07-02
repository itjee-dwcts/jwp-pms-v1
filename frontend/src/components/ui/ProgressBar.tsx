import classNames from 'classnames';
import React from 'react';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
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

  /**
   * Provides an accessible name for the progress bar.
   */
  'aria-label'?: string;
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
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  const validPercentage = typeof percentage === 'number' && !isNaN(percentage) ? percentage : 0;
  const clampedPercentage = Math.max(0, Math.min(100, validPercentage));

  // ARIA 속성을 위한 정수값 계산
  const ariaValueNow = Math.round(clampedPercentage);
  const completionText = `${ariaValueNow}% complete`;

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

  // ARIA 속성을 객체로 분리
  const ariaProps = {
    'aria-valuenow': ariaValueNow,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-label': ariaLabel || completionText,
  };

  return (
    <div
      className={containerClasses}
      role="progressbar"
      title={completionText}
      {...ariaProps}
      {...props}
    >
      <div
        className={classNames(barClasses, `progress-bar-width-${ariaValueNow}`)}
      />
    </div>
  );
};

export default ProgressBar;
