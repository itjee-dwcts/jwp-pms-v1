import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * 필요한 권한들 (모든 권한이 있어야 접근 가능)
   */
  requiredPermissions?: string[];
  /**
   * 필요한 역할들 (하나 이상의 역할이 있으면 접근 가능)
   */
  requiredRoles?: string[];
  /**
   * 관리자만 접근 가능한지 여부
   */
  adminOnly?: boolean;
  /**
   * 접근 거부 시 리다이렉트할 경로 (기본: /dashboard)
   */
  fallbackPath?: string;
  /**
   * 로딩 컴포넌트 커스터마이징
   */
  loadingComponent?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  adminOnly = false,
  fallbackPath = '/dashboard',
  loadingComponent
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { hasPermissions, hasAnyRole, isAdmin } = usePermissions();
  const location = useLocation();

  // 로딩 중이면 로딩 스피너 표시
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 관리자 전용 페이지 체크
  if (adminOnly && !isAdmin()) {
    return <Navigate to={fallbackPath} replace />;
  }

  // 역할 기반 접근 제어
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // 권한 기반 접근 제어
  if (requiredPermissions.length > 0 && !hasPermissions(requiredPermissions)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
