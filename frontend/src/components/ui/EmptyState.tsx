// src/components/ui/EmptyState.tsx
import React from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  /** 표시할 아이콘 */
  icon?: React.ReactNode;
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
  /** 액션 버튼 */
  action?: React.ReactNode;
  /** 추가 CSS 클래스 */
  className?: string | undefined;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 이미지 URL (아이콘 대신) */
  image?: string;
  /** 커스텀 컨텐츠 */
  children?: React.ReactNode;
}

/**
 * 데이터가 없을 때 표시하는 빈 상태 컴포넌트
 * 검색 결과가 없거나, 리스트가 비어있을 때 사용
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
  image,
  children,
}) => {
  // 크기별 클래스 정의
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-8 h-8',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'w-12 h-12',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'w-16 h-16',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const containerClasses = cn(
    'flex flex-col items-center justify-center text-center',
    sizeClasses[size].container,
    className
  );

  return (
    <div className={containerClasses}>
      {/* 이미지 또는 아이콘 */}
      {image ? (
        <img
          src={image}
          alt={title}
          className={cn(
            'mb-4 opacity-50',
            size === 'sm' ? 'w-16 h-16' : size === 'md' ? 'w-24 h-24' : 'w-32 h-32'
          )}
        />
      ) : icon ? (
        <div className={cn(
          'mb-4 text-gray-400 dark:text-gray-500',
          sizeClasses[size].icon
        )}>
          {icon}
        </div>
      ) : null}

      {/* 제목 */}
      <h3 className={cn(
        'font-semibold text-gray-900 dark:text-white mb-2',
        sizeClasses[size].title
      )}>
        {title}
      </h3>

      {/* 설명 */}
      {description && (
        <p className={cn(
          'text-gray-500 dark:text-gray-400 mb-6 max-w-md',
          sizeClasses[size].description
        )}>
          {description}
        </p>
      )}

      {/* 액션 버튼 */}
      {action && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action}
        </div>
      )}

      {/* 커스텀 컨텐츠 */}
      {children}
    </div>
  );
};

/**
 * 로딩 상태용 EmptyState
 */
export const LoadingEmptyState: React.FC<{
  title?: string;
  description?: string;
  className?: string;
}> = ({
  title = '로딩 중...',
  description = '데이터를 불러오고 있습니다.',
  className,
}) => {
  return (
    <EmptyState
      icon={
        <div className="animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 w-8 h-8" />
      }
      title={title}
      description={description}
      className={className}
    />
  );
};

/**
 * 에러 상태용 EmptyState
 */
export const ErrorEmptyState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = '오류가 발생했습니다',
  description = '데이터를 불러오는 중 문제가 발생했습니다.',
  onRetry,
  className,
}) => {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      }
      title={title}
      description={description}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            다시 시도
          </button>
        )
      }
      className={className}
    />
  );
};

/**
 * 검색 결과 없음용 EmptyState
 */
export const NoSearchResultsEmptyState: React.FC<{
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}> = ({
  searchQuery,
  onClearSearch,
  className,
}) => {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="검색 결과가 없습니다"
      description={
        searchQuery
          ? `"${searchQuery}"에 대한 검색 결과가 없습니다. 다른 키워드로 시도해보세요.`
          : '검색 조건에 맞는 결과가 없습니다.'
      }
      action={
        onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
          >
            검색 초기화
          </button>
        )
      }
      className={className}
    />
  );
};

/**
 * 권한 없음용 EmptyState
 */
export const UnauthorizedEmptyState: React.FC<{
  title?: string;
  description?: string;
  className?: string;
}> = ({
  title = '권한이 없습니다',
  description = '이 페이지에 접근할 권한이 없습니다.',
  className,
}) => {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      }
      title={title}
      description={description}
      className={className}
    />
  );
};

export default EmptyState;
