import { usePermissions } from '@/hooks/use-permissions';
import type { Permission, WithPermissionsOptions } from '@/types/permission';
import React from 'react';

export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[],
  options: WithPermissionsOptions = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const { hasPermission, loading } = usePermissions();
    const {
      requireAll = false,
      fallbackComponent: FallbackComponent,
      loadingComponent: LoadingComponent
    } = options;

    if (loading && LoadingComponent) {
      return <LoadingComponent />;
    }

    const hasRequiredPermissions = hasPermission(requiredPermissions, { requireAll });

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
