import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../hooks/use-theme';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * 레이아웃 컴포넌트
 * - 전체 애플리케이션의 기본 레이아웃 구조 제공
 * - 사이드바, 헤더, 메인 콘텐츠 영역으로 구성
 * - 반응형 디자인 지원
 * - 다크 모드 테마 적용
 */
const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isDarkMode } = useTheme();

  // 모바일 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // 모바일에서는 기본적으로 사이드바 접기
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    // 초기 체크
    checkMobile();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', checkMobile);

    // 클린업
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 테마 적용 (이미 App.tsx에서 처리되지만 추가 안전장치)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 사이드바 토글 함수
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 모바일에서 사이드바 열렸을 때 오버레이 클릭으로 닫기
  const handleOverlayClick = () => {
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 모바일 오버레이 */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={handleOverlayClick}
        />
      )}

      {/* 사이드바 */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        isMobile={isMobile}
      />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* 헤더 */}
        <Header />

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-full">
            {/* 페이지 콘텐츠 컨테이너 */}
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>

        {/* 푸터 (선택적) */}
        <footer className="hidden md:block bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>© 2024 프로젝트 관리 시스템. 모든 권리 보유.</span>
            <div className="flex items-center space-x-4">
              <span>버전 1.0.0</span>
              <span>•</span>
              <a
                href="#"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                도움말
              </a>
              <span>•</span>
              <a
                href="#"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                지원
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
