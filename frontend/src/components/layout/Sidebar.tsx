import {
  CalendarIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon,
  FolderIcon,
  HomeIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

/**
 * 사이드바 컴포넌트 Props
 */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

/**
 * 네비게이션 메뉴 아이템 타입
 */
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  show: boolean;
  badge?: string | number;
}

/**
 * 사이드바 컴포넌트
 * - 네비게이션 메뉴 제공
 * - 접기/펼치기 기능
 * - 권한 기반 메뉴 표시
 * - 반응형 디자인 지원
 */
const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, isMobile = false }) => {
  const location = useLocation();
  const { user } = useAuth();

  // 권한 체크 함수들
  const canManageUsers = () => user?.role === 'admin';
  const canViewReports = () => user?.role === 'admin' || user?.role === 'manager';

  // 사용자 이니셜 생성 함수
  const getUserInitial = () => {
    if (!user?.full_name) return '?';
    return user.full_name.charAt(0).toUpperCase();
  };

  // 네비게이션 메뉴 아이템들
  const navigationItems: NavigationItem[] = [
    {
      name: '대시보드',
      href: '/dashboard',
      icon: HomeIcon,
      show: true,
    },
    {
      name: '프로젝트',
      href: '/projects',
      icon: FolderIcon,
      show: true,
    },
    {
      name: '작업',
      href: '/tasks',
      icon: Squares2X2Icon,
      show: true,
    },
    {
      name: '캘린더',
      href: '/calendar',
      icon: CalendarIcon,
      show: true,
    },
    {
      name: '사용자',
      href: '/users',
      icon: UsersIcon,
      show: canManageUsers(),
    },
    {
      name: '리포트',
      href: '/reports',
      icon: ChartBarIcon,
      show: canViewReports(),
    },
    {
      name: '설정',
      href: '/settings',
      icon: CogIcon,
      show: true,
    },
  ];

  // 권한에 따라 필터링된 메뉴 아이템들
  const filteredItems = navigationItems.filter(item => item.show);

  return (
    <div
      className={classNames(
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64',
        isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'
      )}
    >
      {/* 사이드바 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            {/* 로고 */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PMS</span>
            </div>
            {/* 앱 이름 */}
            <span className="font-semibold text-gray-900 dark:text-white">
              프로젝트 관리자
            </span>
          </div>
        )}

        {/* 사이드바 토글 버튼 */}
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: linkActive }) =>
                classNames(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 relative',
                  linkActive || isActive
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                )
              }
              title={collapsed ? item.name : undefined}
            >
              {/* 아이콘 */}
              <item.icon
                className={classNames(
                  'flex-shrink-0 h-6 w-6',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300',
                  collapsed ? 'mr-0' : 'mr-3'
                )}
              />

              {/* 메뉴 이름 */}
              {!collapsed && (
                <span className="flex-1">{item.name}</span>
              )}

              {/* 배지 (알림 등) */}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
                  {item.badge}
                </span>
              )}

              {/* 활성 상태 표시 */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* 사용자 정보 영역 */}
      {user && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            {/* 사용자 아바타 */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {getUserInitial()}
                </span>
              </div>
            </div>

            {/* 사용자 정보 (펼쳐진 상태에서만 표시) */}
            {!collapsed && (
              <div className="ml-3 overflow-hidden flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.full_name || '사용자'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email || '이메일 없음'}
                </p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    온라인
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 사이드바 하단 정보 */}
      {!collapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <div>PMS v1.0.0</div>
            <div className="mt-1">© 2024 프로젝트 관리 시스템</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
