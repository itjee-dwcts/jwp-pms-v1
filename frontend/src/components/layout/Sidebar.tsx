import {
    CalendarIcon,
    ChartBarIcon,
    CheckSquareIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CogIcon,
    FolderIcon,
    HomeIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore, usePermissions } from '../../stores/authStore';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { canManageUsers, canViewReports } = usePermissions();

  const navigationItems = [
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
      icon: CheckSquareIcon,
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
      show: canManageUsers,
    },
    {
      name: '리포트',
      href: '/reports',
      icon: ChartBarIcon,
      show: canViewReports,
    },
    {
      name: '설정',
      href: '/settings',
      icon: CogIcon,
      show: true,
    },
  ];

  const filteredItems = navigationItems.filter(item => item.show);

  return (
    <div
      className={classNames(
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PMS</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Project Manager
            </span>
          </div>
        )}

        <button
          onClick={onToggle}
          className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={classNames(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                isActive
                  ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={classNames(
                  'flex-shrink-0 h-6 w-6',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300',
                  collapsed ? 'mr-0' : 'mr-3'
                )}
              />
              {!collapsed && item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* 사용자 정보 */}
      {user && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user.fullName.charAt(0)}
                </span>
              </div>
            </div>
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
