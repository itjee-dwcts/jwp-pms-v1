import {
  BellIcon,
  CogIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PowerIcon,
  SunIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useTheme } from '../../hooks/use-theme';

/**
 * 헤더 컴포넌트
 * - 검색 기능
 * - 테마 토글 (다크/라이트 모드)
 * - 알림 시스템
 * - 사용자 메뉴 (프로필, 설정, 로그아웃)
 */
const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지하여 드롭다운 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 사용자 메뉴 외부 클릭 시 닫기
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      // 알림 메뉴 외부 클릭 시 닫기
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 처리 함수
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: 검색 기능 구현
      console.log('검색 쿼리:', searchQuery);
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 사용자 이니셜 생성 함수
  const getUserInitial = () => {
    if (!user?.full_name) return '?';
    return user.full_name.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* 검색 영역 */}
        <div className="flex items-center flex-1 max-w-lg">
          <form onSubmit={handleSearch} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="프로젝트, 작업, 사용자 검색..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </form>
        </div>

        {/* 우측 메뉴 영역 */}
        <div className="flex items-center space-x-2">
          {/* 테마 토글 버튼 */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>

          {/* 알림 드롭다운 */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md relative transition-colors"
              title="알림"
            >
              <BellIcon className="h-5 w-5" />
              {/* 알림 표시 점 */}
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
            </button>

            {/* 알림 드롭다운 메뉴 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  {/* 알림 헤더 */}
                  <div className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    알림
                  </div>
                  {/* 알림 내용 */}
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      새로운 알림이 없습니다.
                    </div>
                    {/* TODO: 실제 알림 목록 표시 */}
                  </div>
                  {/* 알림 더보기 링크 */}
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <Link
                      to="/notifications"
                      className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-center"
                      onClick={() => setShowNotifications(false)}
                    >
                      모든 알림 보기
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 사용자 메뉴 드롭다운 */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="사용자 메뉴"
            >
              {/* 사용자 아바타 */}
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {getUserInitial()}
                </span>
              </div>
              {/* 사용자 이름 (데스크톱에서만 표시) */}
              <span className="text-sm font-medium text-gray-900 dark:text-white hidden md:block">
                {user?.full_name || '사용자'}
              </span>
            </button>

            {/* 사용자 드롭다운 메뉴 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  {/* 사용자 정보 */}
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user?.full_name || '사용자'}
                    </div>
                    <div className="text-xs">
                      {user?.email || '이메일 없음'}
                    </div>
                  </div>

                  {/* 프로필 링크 */}
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="mr-3 h-4 w-4" />
                    프로필
                  </Link>

                  {/* 설정 링크 */}
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <CogIcon className="mr-3 h-4 w-4" />
                    설정
                  </Link>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                  {/* 로그아웃 버튼 */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PowerIcon className="mr-3 h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
