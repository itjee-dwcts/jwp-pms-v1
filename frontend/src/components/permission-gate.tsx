import { usePermissions } from '@/hooks/use-permissions';
import type { PermissionGateProps } from '@/types/permission';
import React from 'react';

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permissions,
  requireAll = false,
  role,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasRole } = usePermissions();

  const hasRequiredPermissions = hasPermission(permissions, { requireAll });
  const hasRequiredRole = role ? hasRole(role) : true;

  if (hasRequiredPermissions && hasRequiredRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
