import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { useAuth } from './hooks/use-auth';
import { useTheme } from './hooks/use-theme';

// 더 나은 성능을 위한 페이지 지연 로딩
const DashboardPage = React.lazy(() => import('./pages/dashboard/Dashboard'));
const ProjectsPage = React.lazy(() => import('./pages/project/Projects'));
const ProjectDetailPage = React.lazy(() => import('./pages/project/ProjectDetail'));
const TasksPage = React.lazy(() => import('./pages/task/Tasks'));
const TaskDetailPage = React.lazy(() => import('./pages/task/TaskDetail'));
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
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center space-y-4">
      {/* 로딩 스피너 */}
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      {/* 로딩 텍스트 */}
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

  // 인증 상태 확인 중일 때 로딩 표시
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 특정 역할이 필요한 경우 권한 확인
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// 공개 라우트 컴포넌트 (이미 인증된 경우 대시보드로 리다이렉트)
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 인증 상태 확인 중일 때 로딩 표시
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 이미 인증된 경우 대시보드로 리다이렉트
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// 전역 window 객체에 hideLoadingScreen 속성 추가
declare global {
  interface Window {
    hideLoadingScreen?: () => void;
  }
}

// 메인 앱 컴포넌트
const App: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { checkAuthStatus } = useAuth();

  // 앱 로드 시 인증 상태 및 테마 초기화
  useEffect(() => {
    // 인증 상태 확인
    checkAuthStatus();
  }, [checkAuthStatus]);

  // 다크 모드 클래스를 document에 적용
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 앱 로드 완료 알림 (index.html의 로딩 화면 숨기기)
  useEffect(() => {
    // 앱이 준비되면 로딩 화면 숨기기
    if (window.hideLoadingScreen) {
      window.hideLoadingScreen();
    }
  }, []);

  return (
    <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
      <React.Suspense fallback={<LoadingSpinner />}>
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

            {/* 작업 관련 라우트 */}
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />

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
