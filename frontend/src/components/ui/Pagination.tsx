// src/components/ui/Pagination.tsx
import {
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  currentPage: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 페이지 변경 핸들러 */
  onPageChange: (page: number) => void;
  /** 페이지당 항목 수 */
  itemsPerPage?: number;
  /** 전체 항목 수 */
  totalItems?: number;
  /** 표시할 페이지 번호 개수 */
  siblingCount?: number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 간단한 모드 (이전/다음 버튼만) */
  simple?: boolean;
  /** 정보 표시 여부 */
  showInfo?: boolean;
  /** 처음/마지막 페이지 버튼 표시 여부 */
  showBoundaryButtons?: boolean;
}

/**
 * 페이지네이션 컴포넌트
 * 리스트나 테이블에서 페이지 분할 네비게이션을 제공
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  siblingCount = 1,
  className,
  size = 'md',
  simple = false,
  showInfo = true,
  showBoundaryButtons = true,
}) => {
  // 크기별 클래스 정의
  const sizeClasses = {
    sm: {
      button: 'px-2 py-1 text-xs',
      spacing: 'space-x-1',
    },
    md: {
      button: 'px-3 py-2 text-sm',
      spacing: 'space-x-1',
    },
    lg: {
      button: 'px-4 py-2 text-base',
      spacing: 'space-x-2',
    },
  };

  /**
   * 표시할 페이지 번호 배열 생성
   */
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      // 총 페이지가 7개 이하면 모든 페이지 표시
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }

    return [];
  };

  /**
   * 페이지 버튼 클래스 생성
   */
  const getPageButtonClasses = (isActive: boolean, isDisabled: boolean = false) => {
    return cn(
      'inline-flex items-center justify-center border font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      sizeClasses[size].button,
      isDisabled
        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
        : isActive
        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
    );
  };

  /**
   * 정보 텍스트 생성
   */
  const getInfoText = (): string => {
    if (!itemsPerPage || !totalItems) {
      return `${totalPages}페이지 중 ${currentPage}페이지`;
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return `총 ${totalItems.toLocaleString()}개 중 ${startItem.toLocaleString()}-${endItem.toLocaleString()}개`;
  };

  // 페이지가 1개 이하면 렌더링하지 않음
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = simple ? [] : getPageNumbers();

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* 정보 표시 */}
      {showInfo && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {getInfoText()}
        </div>
      )}

      {/* 페이지네이션 버튼 */}
      <div className={cn('flex items-center', sizeClasses[size].spacing)}>
        {/* 처음 페이지 버튼 */}
        {showBoundaryButtons && !simple && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={cn(
              getPageButtonClasses(false, currentPage === 1),
              'rounded-l-md'
            )}
            aria-label="첫 페이지"
          >
            <ChevronDoubleLeftIcon className="w-4 h-4" />
          </button>
        )}

        {/* 이전 페이지 버튼 */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={cn(
            getPageButtonClasses(false, currentPage === 1),
            !showBoundaryButtons || simple ? 'rounded-l-md' : ''
          )}
          aria-label="이전 페이지"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          {simple && <span className="ml-2">이전</span>}
        </button>

        {/* 페이지 번호 버튼들 */}
        {!simple && pageNumbers.map((pageNumber, index) => {
          if (pageNumber === '...') {
            return (
              <span
                key={`dots-${index}`}
                className={cn(
                  'inline-flex items-center justify-center border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
                  sizeClasses[size].button
                )}
              >
                ...
              </span>
            );
          }

          const page = pageNumber as number;
          const isActive = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={getPageButtonClasses(isActive)}
              aria-label={`${page}페이지`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        {/* 다음 페이지 버튼 */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={cn(
            getPageButtonClasses(false, currentPage === totalPages),
            !showBoundaryButtons || simple ? 'rounded-r-md' : ''
          )}
          aria-label="다음 페이지"
        >
          {simple && <span className="mr-2">다음</span>}
          <ChevronRightIcon className="w-4 h-4" />
        </button>

        {/* 마지막 페이지 버튼 */}
        {showBoundaryButtons && !simple && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(
              getPageButtonClasses(false, currentPage === totalPages),
              'rounded-r-md'
            )}
            aria-label="마지막 페이지"
          >
            <ChevronDoubleRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 간단한 페이지네이션 컴포넌트
 */
export const SimplePagination: React.FC<Omit<PaginationProps, 'simple'>> = (props) => {
  return <Pagination {...props} simple={true} />;
};

/**
 * 컴팩트 페이지네이션 컴포넌트
 */
export const CompactPagination: React.FC<Omit<PaginationProps, 'showInfo' | 'showBoundaryButtons'>> = (props) => {
  return <Pagination {...props} showInfo={false} showBoundaryButtons={false} />;
};

export default Pagination;
