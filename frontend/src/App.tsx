import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PageLoadingSpinner from './components/ui/LoadingSpinner';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import ForgotPasswordPage from './pages/auth/ForgotPassword';
import Layout from './components/layout/Layout';
import {useAuth} from './hooks/use-auth'
import DashboardPage from './pages/dashboard/Dashboard'; // Adjust the path if necessary
import ProjectDetailPage from './pages/project/ProjectDetail';
import ProjectsPage from './pages/project/Projects';
import TasksPage from './pages/task/Tasks';
import TaskDetailPage from './pages/task/TaskDetail';
import CalendarPage from './pages/calendar/Calendar';
import UsersPage from './pages/user/Users';
import ProfilePage from './pages/user/Profile';
import SettingsPage from './pages/common/Settings';
import NotFoundPage from './pages/error/NotFound';

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
    return <PageLoadingSpinner />;
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
    return <PageLoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  useEffect(() => {
    console.log('✅ React 앱 마운트됨');
    if (window.hideLoadingScreen) {
      window.hideLoadingScreen();
    }
  }, []);

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
