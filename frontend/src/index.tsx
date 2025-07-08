// src/index.tsx - 안정화된 버전
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// 전역 타입 선언
declare global {
  interface Window {
    hideLoadingScreen?: () => void;
    onReactReady?: () => void;
    showErrorPage?: (message: string) => void;
  }
}

console.log('🚀 React index.tsx 시작...');

// 안전한 앱 부트스트래핑
async function bootstrapApp() {
  try {
    // DOM 요소 확인
    const container = document.getElementById('root');
    if (!container) {
      throw new Error('루트 컨테이너를 찾을 수 없습니다!');
    }

    console.log('✅ 루트 컨테이너 발견');

    // React 루트 생성
    const root = createRoot(container);
    console.log('✅ React 루트 생성 완료');

    // React 앱 렌더링
    console.log('🎯 React 앱 렌더링 시작...');
    
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </BrowserRouter>
      </React.StrictMode>
    );
    
    console.log('✅ React 앱 렌더링 완료');
    
    // 렌더링 완료 확인 (약간의 지연 후)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // React 앱이 마운트되었는지 확인
    const appElement = container.querySelector('div');
    if (appElement) {
      console.log('✅ React 앱이 성공적으로 마운트되었습니다!');
      
      // React 준비 완료 알림
      if (window.onReactReady) {
        window.onReactReady();
      }
    } else {
      throw new Error('React 앱 마운트 확인 실패');
    }

  } catch (error) {
    console.error('❌ React 앱 부트스트래핑 실패:', error);
    
    // 에러 페이지 표시
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    if (window.showErrorPage) {
      window.showErrorPage(errorMessage);
    } else {
      // fallback 에러 페이지
      const container = document.getElementById('root');
      if (container) {
        container.innerHTML = `
          <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; padding: 20px; background: #f9fafb;">
            <div style="text-align: center; max-width: 400px; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #ef4444; margin-bottom: 16px; font-size: 24px; font-weight: 600;">⚠️ 앱 로딩 실패</h1>
              <p style="color: #6b7280; margin-bottom: 24px; line-height: 1.5;">React 앱을 시작할 수 없습니다.<br>페이지를 새로고침해주세요.</p>
              <button onclick="window.location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                🔄 새로고침
              </button>
              <details style="margin-top: 16px; text-align: left;">
                <summary style="cursor: pointer; color: #6b7280; font-size: 14px;">오류 세부사항</summary>
                <pre style="background: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 12px; margin-top: 8px; color: #374151; white-space: pre-wrap;">${errorMessage}</pre>
              </details>
            </div>
          </div>
        `;
      }
    }
  }
}

// 에러 바운더리 컴포넌트
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 React Error Boundary 캐치:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 React Error Boundary 세부정보:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ 앱 오류 발생
            </h1>
            <p className="text-gray-600 mb-6">
              예상치 못한 오류가 발생했습니다.<br />
              페이지를 새로고침해주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 새로고침
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  개발자 정보
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// DOM이 준비되면 앱 부트스트래핑 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}