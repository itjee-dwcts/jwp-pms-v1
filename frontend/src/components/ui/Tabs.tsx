// src/components/ui/Tabs.tsx
import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  /** 탭 ID */
  id: string;
  /** 탭 라벨 */
  label: string;
  /** 탭 아이콘 */
  icon?: React.ReactNode;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 배지 카운트 */
  count?: number;
  /** 숨김 여부 */
  hidden?: boolean;
}

export interface TabsProps {
  /** 탭 목록 */
  tabs: TabItem[];
  /** 활성 탭 ID */
  activeTab: string;
  /** 탭 변경 핸들러 */
  onChange: (tabId: string) => void;
  /** 탭 스타일 */
  variant?: 'default' | 'pills' | 'underline' | 'bordered';
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 정렬 */
  align?: 'left' | 'center' | 'right';
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
  /** 스크롤 가능 여부 */
  scrollable?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 탭 컨텐츠 */
  children?: React.ReactNode;
}

/**
 * 탭 네비게이션 컴포넌트
 * 여러 패널 간 전환을 위한 탭 인터페이스 제공
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  align = 'left',
  fullWidth = false,
  scrollable = false,
  className,
  children,
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  // 크기별 클래스 정의
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  // 정렬 클래스
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  /**
   * 활성 탭 표시기 스타일 업데이트
   */
  useEffect(() => {
    if (variant === 'underline') {
      const activeTabElement = document.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;
        setIndicatorStyle({
          left: offsetLeft,
          width: offsetWidth,
        });
      }
    }
  }, [activeTab, variant, tabs]);

  /**
   * 탭 버튼 클래스 생성
   */
  const getTabButtonClasses = (tab: TabItem, isActive: boolean) => {
    const baseClasses = cn(
      'relative inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      sizeClasses[size],
      fullWidth && 'flex-1'
    );

    switch (variant) {
      case 'pills':
        return cn(
          baseClasses,
          'rounded-md',
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
        );

      case 'underline':
        return cn(
          baseClasses,
          'border-b-2 rounded-none',
          isActive
            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
        );

      case 'bordered':
        return cn(
          baseClasses,
          'border rounded-t-md -mb-px',
          isActive
            ? 'border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
        );

      default:
        return cn(
          baseClasses,
          'rounded-md',
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
        );
    }
  };

  /**
   * 탭 컨테이너 클래스 생성
   */
  const getTabsContainerClasses = () => {
    return cn(
      'flex',
      alignClasses[align],
      fullWidth && 'w-full',
      scrollable && 'overflow-x-auto',
      variant === 'bordered' && 'border-b border-gray-300 dark:border-gray-600',
      variant === 'underline' && 'border-b border-gray-200 dark:border-gray-700',
      variant === 'pills' && 'space-x-2',
      variant === 'default' && 'space-x-1'
    );
  };

  // 표시할 탭 필터링
  const visibleTabs = tabs.filter(tab => !tab.hidden);

  return (
    <div className={cn('w-full', className)}>
      {/* 탭 네비게이션 */}
      <div className="relative">
        <nav className={getTabsContainerClasses()} role="tablist">
          {visibleTabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                role="tab"
                aria-selected={isActive ? true : false}
                aria-controls={`tabpanel-${tab.id}`}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && onChange(tab.id)}
                className={getTabButtonClasses(tab, isActive)}
                title={tab.label}
              >
                {/* 아이콘 */}
                {tab.icon && (
                  <span className="mr-2 flex-shrink-0">
                    {tab.icon}
                  </span>
                )}

                {/* 라벨 */}
                <span className={scrollable ? 'whitespace-nowrap' : ''}>
                  {tab.label}
                </span>

                {/* 카운트 배지 */}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full',
                    isActive
                      ? 'bg-white text-blue-600'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  )}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Underline 변형용 활성 표시기 */}
        {variant === 'underline' && (
          <div
            className="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-200"
            style={indicatorStyle}
          />
        )}
      </div>

      {/* 탭 컨텐츠 */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * 탭 패널 컴포넌트
 */
export interface TabPanelProps {
  /** 탭 ID */
  tabId: string;
  /** 활성 탭 ID */
  activeTab: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 컨텐츠 */
  children: React.ReactNode;
  /** 지연 로딩 여부 */
  lazy?: boolean;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  tabId,
  activeTab,
  className,
  children,
  lazy = false,
}) => {
  const [hasBeenActive, setHasBeenActive] = useState(false);
  const isActive = tabId === activeTab;

  useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);

  // 지연 로딩이 활성화되고 한 번도 활성화된 적이 없으면 렌더링하지 않음
  if (lazy && !hasBeenActive) {
    return null;
  }

  return (
    <div
      id={`tabpanel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      className={cn(
        'focus:outline-none',
        !isActive && 'hidden',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * 버티컬 탭 컴포넌트
 */
export const VerticalTabs: React.FC<Omit<TabsProps, 'align' | 'fullWidth'>> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  className,
  children,
}) => {
  const visibleTabs = tabs.filter(tab => !tab.hidden);

  return (
    <div className={cn('flex', className)}>
      {/* 탭 네비게이션 */}
      <nav className="flex flex-col space-y-1 min-w-0 flex-shrink-0" role="tablist">
        {visibleTabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={cn(
                'flex items-center text-left px-4 py-3 text-sm font-medium rounded-md transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
              )}
            >
              {tab.icon && (
                <span className="mr-3 flex-shrink-0">
                  {tab.icon}
                </span>
              )}
              <span className="truncate">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  'ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                )}>
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 탭 컨텐츠 */}
      {children && (
        <div className="flex-1 ml-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default Tabs;
