import { usePermissions } from '@/hooks/use-permissions';
import type { Permission, WithPermissionsOptions } from '@/types/permission';
import React from 'react';

export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[],
  options: WithPermissionsOptions = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const { hasPermission, hasAllPermissions, hasAnyPermission, loading } = usePermissions();
    const {
      requireAll = true,
      fallbackComponent: FallbackComponent,
      loadingComponent: LoadingComponent
    } = options;

    if (loading && LoadingComponent) {
      return <LoadingComponent />;
    }

    // 권한 체크 로직 수정
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasRequiredPermissions) {
      if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPermissions(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
