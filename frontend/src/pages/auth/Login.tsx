import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/use-auth';

// 임시 config 객체 (실제 config.ts 파일이 없는 경우 대비)
const config = {
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  GITHUB_CLIENT_ID: process.env.REACT_APP_GITHUB_CLIENT_ID || '',
  APP_NAME: process.env.REACT_APP_APP_NAME || 'PMS',
};

interface LoginFormData {
  username: string;
  password: string;
  remember: boolean;
}

/**
 * 로그인 페이지 컴포넌트
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // 폼 상태 관리
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  // 이미 인증된 경우 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('✅ 이미 인증된 사용자 - 리다이렉트:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  /**
   * 폼 유효성 검사
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    // 사용자명/이메일 검증
    if (!formData.username.trim()) {
      newErrors.username = '사용자명 또는 이메일을 입력해주세요';
    } else if (formData.username.length < 2) {
      newErrors.username = '사용자명은 2자 이상이어야 합니다';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 로그인 폼 제출 처리
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 유효성 검사
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      console.log('🚀 로그인 폼 제출:', formData.username);

      // 로그인 시도
      await login({
        username: formData.username,
        password: formData.password,
      });

      toast.success('로그인 성공!');

      // 의도한 페이지 또는 대시보드로 리다이렉트
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다';
      console.error('❌ 로그인 오류:', error);

      toast.error(errorMessage);

      // 인증 실패 시 폼 에러 표시
      if (errorMessage.toLowerCase().includes('credential') ||
          errorMessage.toLowerCase().includes('password') ||
          errorMessage.toLowerCase().includes('비밀번호')) {
        setErrors({
          username: '사용자명 또는 비밀번호가 올바르지 않습니다',
          password: '사용자명 또는 비밀번호가 올바르지 않습니다',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 입력 필드 변경 처리
   */
  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'remember' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * OAuth 로그인 처리
   */
  const handleOAuthLogin = (provider: 'google' | 'github') => {
    const clientId = provider === 'google' ? config.GOOGLE_CLIENT_ID : config.GITHUB_CLIENT_ID;

    if (!clientId) {
      toast.error(`${provider} OAuth가 설정되지 않았습니다`);
      return;
    }

    // OAuth 로그인 구현 예정
    toast(`${provider} OAuth 로그인 기능은 곧 지원될 예정입니다!`);
  };

  /**
   * 테스트 계정으로 빠른 로그인
   */
  const handleQuickLogin = () => {
    setFormData({
      username: 'test',
      password: '123456',
      remember: false,
    });
    setErrors({});
  };

  // 인증 상태 확인 중일 때 로딩 스피너 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            인증 상태를 확인하는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            계정에 로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            또는{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              새 계정을 생성하세요
            </Link>
          </p>
        </div>

        {/* 로그인 폼 */}
        <Card className="p-8">
          {/* 개발 환경에서 테스트 버튼 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                개발 모드: 테스트 계정으로 빠른 로그인
              </p>
              <button
                type="button"
                onClick={handleQuickLogin}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                테스트 계정 입력 (testuser / 123456)
              </button>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 사용자명/이메일 필드 */}
            <div>
              <label htmlFor="username" className="sr-only">
                사용자명 또는 이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={`pl-10 ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="사용자명 또는 이메일 주소"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.username}
                </p>
              )}
            </div>

            {/* 비밀번호 필드 */}
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {/* 로그인 유지 및 비밀번호 찾기 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.remember}
                  onChange={handleInputChange('remember')}
                  disabled={loading}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  로그인 상태 유지
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                variant="primary"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </Button>
            </div>

            {/* 구분선 */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    또는 다음으로 계속
                  </span>
                </div>
              </div>

              {/* OAuth 버튼들 */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={loading}
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* 푸터 */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            로그인하면{' '}
            <Link
              to="/terms"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              서비스 약관
            </Link>
            {' '}및{' '}
            <Link
              to="/privacy"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              개인정보 처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>

        {/* 개발 환경에서만 디버그 정보 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
            <h4 className="font-medium mb-2">개발 모드 정보:</h4>
            <ul className="space-y-1">
              <li>• 인증 상태: {isAuthenticated ? '✅ 인증됨' : '❌ 미인증'}</li>
              <li>• 로딩 상태: {authLoading ? '⏳ 로딩 중' : '✅ 완료'}</li>
              <li>• 테스트 계정: testuser / 123456</li>
              <li>• 비밀번호는 6자 이상이면 로그인 성공</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
