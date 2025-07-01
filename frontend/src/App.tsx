import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Lazy load pages for better performance
const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const ProjectsPage = React.lazy(() => import('./pages/project/Projects'));
const ProjectDetailPage = React.lazy(() => import('./pages/project/ProjectDetail'));
const TasksPage = React.lazy(() => import('./pages/task/Tasks'));
const TaskDetailPage = React.lazy(() => import('./pages/task/TaskDetailPage'));
const CalendarPage = React.lazy(() => import('./pages/calendar/Calendar'));
const UsersPage = React.lazy(() => import('./pages/user/UsersPage'));
const ProfilePage = React.lazy(() => import('./pages/common/Profile'));
const SettingsPage = React.lazy(() => import('./pages/common/Settings'));

// Auth pages
const LoginPage = React.lazy(() => import('./pages/auth/Login'));
const RegisterPage = React.lazy(() => import('./pages/auth/Register'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPassword'));

// Error pages
const NotFoundPage = React.lazy(() => import('./pages/error/NotFound'));

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="spinner w-8 h-8"></div>
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Component
const App: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const { checkAuthStatus } = useAuthStore();

  // Initialize auth status and theme on app load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="App">
      <React.Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
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

          {/* Protected Routes with Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Projects */}
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />

            {/* Tasks */}
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />

            {/* Calendar */}
            <Route path="calendar" element={<CalendarPage />} />

            {/* Users (Admin only) */}
            <Route path="users" element={<UsersPage />} />

            {/* Profile */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </React.Suspense>
    </div>
  );
};

export default App;
