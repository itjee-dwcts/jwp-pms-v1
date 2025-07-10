import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/use-auth';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  agreeToTerms: boolean;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  // 이미 인증된 사용자는 대시보드로 리디렉션
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    // 사용자명 유효성 검사
    if (!formData.username.trim()) {
      newErrors.username = '사용자명은 필수입니다';
    } else if (formData.username.length < 3) {
      newErrors.username = '사용자명은 최소 3자 이상이어야 합니다';
    } else if (formData.username.length > 30) {
      newErrors.username = '사용자명은 30자 미만이어야 합니다';
    } else if (!/^[a-zA-Z0-9_.@]+$/.test(formData.username)) {
      newErrors.username = '사용자명은 영문, 숫자, 밑줄(_), 점(.), (@)만 사용할 수 있습니다';
    }

    // 이메일 유효성 검사
    if (!formData.email.trim()) {
      newErrors.email = '이메일은 필수입니다';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 주소를 입력해 주세요';
    }

    // 이름 유효성 검사
    if (!formData.fullName.trim()) {
      newErrors.fullName = '이름은 필수입니다';
    }

    // 비밀번호 유효성 검사
    if (!formData.password) {
      newErrors.password = '비밀번호는 필수입니다';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '비밀번호는 대문자, 소문자, 숫자를 각각 하나 이상 포함해야 합니다';
    }

    // 비밀번호 확인 유효성 검사
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인은 필수입니다';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    // 약관 동의 유효성 검사
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
      });

      toast.success('계정이 성공적으로 생성되었습니다!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다';
      toast.error(errorMessage);

      // 백엔드에서 오는 특정 유효성 검사 오류 처리
      if (errorMessage.toLowerCase().includes('username')) {
        setErrors(prev => ({ ...prev, username: '이미 사용 중인 사용자명입니다' }));
      } else if (errorMessage.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: '이미 등록된 이메일입니다' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'agreeToTerms' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // 해당 필드의 오류 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 인증 확인 중일 때 로딩 스피너 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
            <UserPlusIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            계정 만들기
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              여기서 로그인하세요
            </Link>
          </p>
        </div>

        {/* 회원가입 폼 */}
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 이름 필드 */}
            <div>
              <div>
                <label htmlFor="fullName" className="sr-only">
                  이름
                </label>
                {/* <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className={errors.fullName ? 'border-red-500' : ''}
                  placeholder="이름"
                  value={formData.fullName}
                  onChange={handleInputChange('fullName')}
                  disabled={loading}
                /> */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="given-name"
                    required
                    className={`pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="전체이름"
                    value={formData.fullName}
                    onChange={handleInputChange('fullName')}
                    disabled={loading}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.fullName}
                  </p>
                )}
              </div>
            </div>

            {/* 사용자명 필드 */}
            <div>
              <label htmlFor="username" className="sr-only">
                사용자명
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
                  className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                  placeholder="사용자명"
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

            {/* 이메일 필드 */}
            <div>
              <label htmlFor="email" className="sr-only">
                이메일 주소
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="이메일 주소"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email}
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
                  autoComplete="new-password"
                  required
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {/* 비밀번호 확인 필드 */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                비밀번호 확인
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="비밀번호 확인"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* 이용약관 동의 */}
            <div>
              <div className="flex items-center">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                    errors.agreeToTerms ? 'border-red-500' : ''
                  }`}
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange('agreeToTerms')}
                  disabled={loading}
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  {' '}
                  <Link
                    to="/terms"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    서비스 이용약관
                  </Link>
                  {' '}및{' '}
                  <Link
                    to="/privacy"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    개인정보 처리방침
                  </Link>
                  에 동의합니다
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.agreeToTerms}
                </p>
              )}
            </div>

            {/* 제출 버튼 */}
            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    계정 생성 중...
                  </>
                ) : (
                  '계정 만들기'
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* 비밀번호 요구사항 */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
          <h4 className="font-medium mb-2">비밀번호 요구사항:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>최소 8자 이상</li>
            <li>대문자와 소문자 포함</li>
            <li>최소 하나의 숫자 포함</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;
