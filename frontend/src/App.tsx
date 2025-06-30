import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { initializeAuth, useAuthStore } from './store/authStore';
import { initializeTheme } from './store/themeStore';

// Layout 컴포넌트
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// 페이지 컴포넌트
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import TaskDetailPage from './pages/TaskDetailPage';
import TasksPage from './pages/TasksPage';
import UsersPage from './pages/UsersPage';

// 스타일
import './index.css';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // 앱 초기화
    const initializeApp = async () => {
      // 테마 초기화
      initializeTheme();

      // 인증 초기화
      await initializeAuth();
    };

    initializeApp();
  }, []);

  // 인증 상태 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">PMS</span>
          </div>
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 공개 라우트 (인증 불필요) */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
          />

          {/* 보호된 라우트 (인증 필요) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* 404 페이지 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Toast 알림 */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

export default App;
