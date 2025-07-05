import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { FallbackProps } from 'react-error-boundary';


/**
 * 애플리케이션 오류 발생 시 표시되는 폴백 컴포넌트
 * React Error Boundary와 함께 사용됩니다.
 */
const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 오류 정보를 콘솔에 출력
  React.useEffect(() => {
    console.error('애플리케이션 오류:', error);
  }, [error]);

  // 페이지 새로고침 핸들러
  const handleRefresh = () => {
    window.location.reload();
  };

  // 오류 리포트 핸들러 (프로덕션에서는 실제 오류 리포팅 서비스로 전송)
  const handleReportError = () => {
    // TODO: 실제 프로덕션에서는 Sentry 등의 오류 리포팅 서비스로 전송
    console.log('오류 리포트:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // 사용자에게 피드백 제공
    alert('오류가 신고되었습니다. 빠른 시일 내에 수정하겠습니다.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 오류 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-full">
            <ExclamationTriangleIcon
              className="h-12 w-12 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
          </div>

          {/* 오류 제목 */}
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            앗! 문제가 발생했습니다
          </h2>

          {/* 오류 설명 */}
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>

          {/* 개발 환경에서만 오류 상세 정보 표시 */}
          {isDevelopment && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-left">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                개발 모드 - 오류 상세 정보:
              </h3>
              <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
                <p><strong>메시지:</strong> {error.message}</p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer hover:text-red-600 dark:hover:text-red-200">
                      스택 트레이스 보기
                    </summary>
                    <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900/20 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          {/* 다시 시도 버튼 */}
          <button
            onClick={resetErrorBoundary}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowPathIcon
              className="h-5 w-5 mr-2 group-hover:animate-spin"
              aria-hidden="true"
            />
            다시 시도
          </button>

          {/* 페이지 새로고침 버튼 */}
          <button
            onClick={handleRefresh}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            <ArrowPathIcon
              className="h-5 w-5 mr-2"
              aria-hidden="true"
            />
            페이지 새로고침
          </button>

          {/* 오류 신고 버튼 */}
          <button
            onClick={handleReportError}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            <ExclamationTriangleIcon
              className="h-5 w-5 mr-2"
              aria-hidden="true"
            />
            오류 신고하기
          </button>
        </div>

        {/* 추가 도움말 링크 */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            문제가 계속 발생하면{' '}
            <a
              href="mailto:support@pms.com"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              고객 지원팀
            </a>
            으로 문의해주세요.
          </p>
        </div>

        {/* 홈으로 이동 버튼 */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
