import { usePermissions } from '@/hooks/use-permissions';
import type { Permission, Role } from '@/types/permission';
import React from 'react';

interface PermissionGateProps {
  children: React.ReactNode;
  /**
   * 필요한 권한들 (모든 권한이 있어야 렌더링)
   */
  permissions?: Permission[];
  /**
   * 필요한 역할들 (하나 이상의 역할이 있으면 렌더링)
   */
  roles?: Role[];
  /**
   * 관리자만 접근 가능한지 여부
   */
  adminOnly?: boolean;
  /**
   * 모든 권한이 필요한지 여부 (기본: true)
   */
  requireAll?: boolean;
  /**
   * 권한이 없을 때 보여줄 컴포넌트
   */
  fallback?: React.ReactNode;
  /**
   * 조건을 만족하지 않을 때 아무것도 렌더링하지 않을지 여부
   */
  hideWhenDenied?: boolean;
}

/**
 * 권한 기반으로 컴포넌트 렌더링을 제어하는 게이트 컴포넌트
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions = [],
  roles = [],
  adminOnly = false,
  requireAll = true,
  fallback = null,
  hideWhenDenied = false
}) => {
  const {
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    role: currentRole
  } = usePermissions();

  // 관리자 체크
  if (adminOnly && currentRole !== 'admin') {
    return hideWhenDenied ? null : <>{fallback}</>;
  }

  // 역할 체크
  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return hideWhenDenied ? null : <>{fallback}</>;
    }
  }

  // 권한 체크
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return hideWhenDenied ? null : <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default PermissionGate;
