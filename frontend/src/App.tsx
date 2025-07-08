import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/use-auth';
import { useTheme } from './hooks/use-theme';
import { useState } from 'react';
import Layout from './components/layout/Layout';

// 페이지 지연 로딩
const DashboardPage = React.lazy(() => import('./pages/dashboard/Dashboard'));
const ProjectsPage = React.lazy(() => import('./pages/project/Projects'));
const ProjectDetailPage = React.lazy(() => import('./pages/project/ProjectDetail'));
const ProjectCreatePage = React.lazy(() => import('./pages/project/ProjectCreate'));
const TasksPage = React.lazy(() => import('./pages/task/Tasks'));
const TaskDetailPage = React.lazy(() => import('./pages/task/TaskDetail'));
const TaskCreatePage = React.lazy(() => import('./pages/task/TaskCreate'));
const CalendarPage = React.lazy(() => import('./pages/calendar/Calendar'));
const UsersPage = React.lazy(() => import('./pages/user/Users'));
const ProfilePage = React.lazy(() => import('./pages/user/Profile'));
const SettingsPage = React.lazy(() => import('./pages/common/Settings'));

// 인증 페이지들
const LoginPage = React.lazy(() => import('./pages/auth/Login'));
const RegisterPage = React.lazy(() => import('./pages/auth/Register'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPassword'));

// 오류 페이지들
const NotFoundPage = React.lazy(() => import('./pages/error/NotFound'));

// 로딩 컴포넌트
const AppLoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
        앱을 초기화하는 중...
      </p>
    </div>
  </div>
);

// 페이지 로딩 컴포넌트
const PageLoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
        페이지를 불러오는 중...
      </p>
    </div>
  </div>
);

// 보호된 라우트 컴포넌트
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// 공개 라우트 컴포넌트
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// 메인 앱 컴포넌트
const App: React.FC = () => {
  const { isDarkMode, initializeTheme } = useTheme();
  const { isAuthenticated, isLoading, checkAuthStatus, user } = useAuth();
  const [isAppInitialized, setIsAppInitialized] = useState(false);

  console.log('🔍 App render - Auth status:', {
    isAuthenticated,
    isLoading,
    user: user?.username || 'no user',
    isAppInitialized
  });

  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 App initialization started...');

        // 1. 테마 초기화
        initializeTheme();
        console.log('✅ Theme initialized');

        // 2. 인증 상태 확인
        await checkAuthStatus();
        console.log('✅ Auth status checked');

        // 3. 초기화 완료
        setIsAppInitialized(true);
        console.log('✅ App initialization completed');

      } catch (error) {
        console.error('❌ App initialization failed:', error);
        // 에러가 발생해도 앱은 표시
        setIsAppInitialized(true);
      }
    };

    initializeApp();
  }, [initializeTheme, checkAuthStatus]);

// 다크 모드 적용
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // CSS 변수 설정 (토스트 테마용)
    if (isDarkMode) {
      root.style.setProperty('--toast-bg', '#374151');
      root.style.setProperty('--toast-color', '#f9fafb');
      root.style.setProperty('--toast-border', '#4b5563');
    } else {
      root.style.setProperty('--toast-bg', '#ffffff');
      root.style.setProperty('--toast-color', '#111827');
      root.style.setProperty('--toast-border', '#e5e7eb');
    }
  }, [isDarkMode]);

  // 로딩 화면 숨기기 처리
  useEffect(() => {
    if (isAppInitialized && !isLoading) {
      // 앱이 완전히 준비되면 로딩 화면 숨기기
      const timer = setTimeout(() => {
        if (window.hideLoadingScreen) {
          window.hideLoadingScreen();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAppInitialized, isLoading]);

  // 앱이 초기화되지 않았으면 아무것도 렌더링하지 않음
  if (!isAppInitialized) {
    return null; // HTML 로딩 화면이 표시됨
  }

  return (
    <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
      <React.Suspense fallback={<PageLoadingSpinner />}>
        <Routes>
          {/* 공개 라우트들 */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />

          {/* 레이아웃을 포함한 보호된 라우트들 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* 루트 경로를 대시보드로 리다이렉트 */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* 대시보드 */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* 프로젝트 관련 라우트 */}
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="projects/create" element={<ProjectCreatePage />} />

            {/* 작업 관련 라우트 */}
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />
            <Route path="tasks/create" element={<TaskCreatePage />} />

            {/* 캘린더 */}
            <Route path="calendar" element={<CalendarPage />} />

            {/* 사용자 관리 (관리자 전용) */}
            <Route
              path="users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* 프로필 */}
            <Route path="profile" element={<ProfilePage />} />

            {/* 설정 */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 페이지 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </React.Suspense>
    </div>
  );
};


export default App;

