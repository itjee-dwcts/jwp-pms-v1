import classNames from 'classnames';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const cardClasses = classNames(
    'bg-white rounded-lg shadow-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    paddingClasses[padding],
    {
      'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer': hover,
    },
    className
  );

  return <div className={cardClasses}>{children}</div>;
};

export default Card;
