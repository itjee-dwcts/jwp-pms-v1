import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorFallback from './components/ui/ErrorFallback';
import './index.css';


// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5분
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

// 오류 핸들러
// 오류 핸들러
const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
  console.error('애플리케이션 오류:', error);
  console.error('오류 위치:', errorInfo.componentStack);
  // 프로덕션 환경에서는 오류 모니터링 서비스(Sentry 등)로 전송
  if (process.env.NODE_ENV === 'production') {
    // TODO: 오류 모니터링 서비스 연동
  }
};

// DOM 루트 요소
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

// 애플리케이션 렌더링
root.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>

        {/* Toast 알림 컴포넌트 */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName="toast-container"
          containerStyle={{
            top: 20,
            right: 20,
            zIndex: 9999,
          }}
          toastOptions={{
            className: 'toast-custom',
            duration: 4000,
            style: {
              borderRadius: '8px',
              fontSize: '14px',
              padding: '12px 16px',
              maxWidth: '400px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
            success: {
              duration: 3000,
              className: 'toast-success',
              style: {
                background: '#10b981',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#10b981',
              },
            },
            error: {
              duration: 5000,
              className: 'toast-error',
              style: {
                background: '#ef4444',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#ef4444',
              },
            },
            loading: {
              duration: Infinity,
              className: 'toast-loading',
              style: {
                background: '#3b82f6',
                color: '#ffffff',
              },
            },
          }}
        />

        {/* 개발 환경에서만 React Query DevTools 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
