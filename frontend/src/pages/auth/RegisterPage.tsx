import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { UserCreateRequest } from '../../types';

interface RegisterFormData extends UserCreateRequest {
  confirmPassword: string;
  agreeToTerms: boolean;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword, agreeToTerms, ...userData } = data;

    const success = await registerUser(userData);
    if (success) {
      navigate('/login', {
        state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' },
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">PMS</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            새 계정 만들기
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              로그인하기
            </Link>
          </p>
        </div>

        {/* 회원가입 폼 */}
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="이름"
                type="text"
                {...register('first_name', {
                  required: '이름을 입력해주세요.',
                  minLength: {
                    value: 2,
                    message: '이름은 최소 2자 이상이어야 합니다.',
                  },
                })}
                error={errors.first_name?.message}
                placeholder="이름"
              />

              <Input
                label="성"
                type="text"
                {...register('last_name', {
                  required: '성을 입력해주세요.',
                  minLength: {
                    value: 2,
                    message: '성은 최소 2자 이상이어야 합니다.',
                  },
                })}
                error={errors.last_name?.message}
                placeholder="성"
              />
            </div>

            <Input
              label="사용자명"
              type="text"
              {...register('username', {
                required: '사용자명을 입력해주세요.',
                minLength: {
                  value: 3,
                  message: '사용자명은 최소 3자 이상이어야 합니다.',
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: '사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다.',
                },
              })}
              error={errors.username?.message}
              placeholder="사용자명을 입력하세요"
            />

            <Input
              label="이메일"
              type="email"
              {...register('email', {
                required: '이메일을 입력해주세요.',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '올바른 이메일 형식을 입력해주세요.',
                },
              })}
              error={errors.email?.message}
              placeholder="이메일을 입력하세요"
            />

            <Input
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: '비밀번호를 입력해주세요.',
                minLength: {
                  value: 8,
                  message: '비밀번호는 최소 8자 이상이어야 합니다.',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.',
                },
              })}
              error={errors.password?.message}
              placeholder="비밀번호를 입력하세요"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              }
            />

            <Input
              label="비밀번호 확인"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: '비밀번호 확인을 입력해주세요.',
                validate: (value) => value === password || '비밀번호가 일치하지 않습니다.',
              })}
              error={errors.confirmPassword?.message}
              placeholder="비밀번호를 다시 입력하세요"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              }
            />

            <div className="flex items-center">
              <input
                id="agree-terms"
                type="checkbox"
                {...register('agreeToTerms', {
                  required: '이용약관에 동의해주세요.',
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  이용약관
                </Link>
                {' '}및{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  개인정보처리방침
                </Link>
                에 동의합니다.
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              계정 만들기
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
