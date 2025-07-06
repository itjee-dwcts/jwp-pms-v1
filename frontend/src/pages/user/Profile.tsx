// src/pages/user/Profile.tsx
import {
  CalendarIcon,
  CameraIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  FolderIcon,
  KeyIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { useAuth } from '../../hooks/use-auth';
import { authService } from '../../services/auth-service';
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../../types/auth';

/**
 * 사용자 프로필 페이지 컴포넌트
 * - 현재 로그인한 사용자의 프로필 정보 표시
 * - 프로필 정보 편집 기능
 * - 프로필 이미지 업로드 기능
 * - 비밀번호 변경 기능
 * - 활동 통계 표시
 */
const Profile: React.FC = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuth();

  // 편집 모드 상태 관리
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 프로필 편집 폼 상태
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    location: user?.location || '',
    website: user?.website || '',
    timezone: user?.timezone || '',
  });

  // 비밀번호 변경 폼 상태 (confirm_password 제거)
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest & { confirm_password: string }>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // 파일 업로드 참조
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 사용자 역할 한글 변환 함수
   */
  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'manager':
        return '매니저';
      case 'developer':
        return '개발자';
      case 'viewer':
        return '뷰어';
      case 'guest':
        return '게스트';
      default:
        return '사용자';
    }
  };


  /**
   * 프로필 업데이트 처리
   */
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
      toast.success('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      toast.error('프로필 업데이트에 실패했습니다.');
      console.error('프로필 업데이트 오류:', error);
    }
  };

  /**
   * 비밀번호 변경 처리
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // 새 비밀번호 확인
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 강도 검증
    if (passwordForm.new_password.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    try {
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      setIsChangePasswordModalOpen(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
    } catch (error) {
      toast.error('비밀번호 변경에 실패했습니다.');
      console.error('비밀번호 변경 오류:', error);
    }
  };

  /**
   * 아바타 업로드 처리
   */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      await authService.uploadAvatar(file);

      // 사용자 정보 새로고침
      await authService.getCurrentUser();

      toast.success('프로필 이미지가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      toast.error('프로필 이미지 업로드에 실패했습니다.');
      console.error('아바타 업로드 오류:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /**
   * 프로필 폼 필드 업데이트
   */
  const updateProfileField = (field: keyof UpdateProfileRequest, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 비밀번호 폼 필드 업데이트
   */
  const updatePasswordField = (field: keyof (ChangePasswordRequest & { confirm_password: string }), value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 편집 취소 처리
   */
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // 원래 사용자 정보로 복원
    setProfileForm({
      full_name: user?.full_name || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      location: user?.location || '',
      website: user?.website || '',
      timezone: user?.timezone || '',
    });
  };

  /**
   * 날짜 포맷팅 함수
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 사용자 정보가 없으면 로딩 스피너 표시
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  function getRoleBadgeVariant(role: string): "default" | "primary" | "success" | "warning" | "danger" {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'manager':
        return 'primary';
      case 'developer':
        return 'success';
      case 'viewer':
        return 'default';
      case 'guest':
        return 'warning';
      default:
        return 'default';
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          프로필
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          개인 정보를 관리하고 계정 설정을 변경하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 프로필 정보 카드 */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                기본 정보
              </h2>
              {!isEditingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                  icon={<PencilIcon className="w-4 h-4" />}
                >
                  편집
                </Button>
              )}
            </div>

            {/* 프로필 편집 폼 */}
            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="이름"
                    value={profileForm.full_name || ''}
                    onChange={(e) => updateProfileField('full_name', e.target.value)}
                    required
                    placeholder="이름을 입력하세요"
                  />
                  <Input
                    label="전화번호"
                    value={profileForm.phone || ''}
                    onChange={(e) => updateProfileField('phone', e.target.value)}
                    placeholder="전화번호를 입력하세요"
                  />
                  <Input
                    label="위치"
                    value={profileForm.location || ''}
                    onChange={(e) => updateProfileField('location', e.target.value)}
                    placeholder="거주 지역을 입력하세요"
                  />
                  <Input
                    label="시간대"
                    value={profileForm.timezone || ''}
                    onChange={(e) => updateProfileField('timezone', e.target.value)}
                    placeholder="시간대를 입력하세요 (예: Asia/Seoul)"
                  />
                </div>

                <Input
                  label="웹사이트"
                  type="url"
                  value={profileForm.website || ''}
                  onChange={(e) => updateProfileField('website', e.target.value)}
                  placeholder="웹사이트 URL을 입력하세요"
                />

                <Textarea
                  label="소개"
                  value={profileForm.bio || ''}
                  onChange={(e) => updateProfileField('bio', e.target.value)}
                  rows={4}
                  placeholder="자신에 대해 간단히 소개해주세요..."
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    loading={isLoading}
                  >
                    저장
                  </Button>
                </div>
              </form>
            ) : (
              /* 프로필 정보 표시 */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">이름</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.full_name || '정보 없음'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">이메일</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.email}
                        </p>
                        {user.is_verified && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-1">
                            인증됨
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">전화번호</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.phone || '정보 없음'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">위치</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.location || '정보 없음'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">가입일</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">역할</p>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </div>

                    {user.timezone && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">시간대</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.timezone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {user.bio && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">소개</p>
                    <p className="text-gray-900 dark:text-white leading-relaxed">{user.bio}</p>
                  </div>
                )}

                {user.website && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">웹사이트</p>
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      {user.website}
                    </a>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 프로필 이미지 카드 */}
          <Card className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar
                src={user.avatar_url ?? null}
                alt={user.full_name || user.email}
                size="xl"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full p-2 shadow-lg transition-colors"
                title="프로필 이미지 변경"
              >
                {isUploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CameraIcon className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                title="프로필 이미지 파일"
              />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.full_name || user.email}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangePasswordModalOpen(true)}
                icon={<KeyIcon className="w-4 h-4" />}
                className="w-full"
              >
                비밀번호 변경
              </Button>
            </div>
          </Card>

          {/* 활동 통계 카드 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              활동 통계
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FolderIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">참여 프로젝트</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.project_count || 0}개
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">완료한 작업</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.completed_tasks_count || 0}개
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700 dark:text-gray-300">진행 중인 작업</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.active_tasks_count || 0}개
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ChartBarIcon className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-700 dark:text-gray-300">기여도</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.contribution_score || 0}%
                </span>
              </div>
            </div>
          </Card>

          {/* 계정 보안 카드 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              계정 보안
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">이메일 인증</span>
                <span className={`font-medium ${user.is_verified ? 'text-green-600' : 'text-red-600'}`}>
                  {user.is_verified ? '완료' : '미완료'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">계정 상태</span>
                <span className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {user.is_active ? '활성' : '비활성'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">2단계 인증</span>
                <span className="font-medium text-red-600">비활성화</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">마지막 로그인</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {user.last_login ? formatDate(user.last_login) : '정보 없음'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      <Modal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        title="비밀번호 변경"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="현재 비밀번호"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => updatePasswordField('current_password', e.target.value)}
            required
            placeholder="현재 비밀번호를 입력하세요"
          />

          <Input
            label="새 비밀번호"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => updatePasswordField('new_password', e.target.value)}
            required
            minLength={8}
            placeholder="새 비밀번호를 입력하세요 (최소 8자)"
          />

          <Input
            label="새 비밀번호 확인"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => updatePasswordField('confirm_password', e.target.value)}
            required
            minLength={8}
            placeholder="새 비밀번호를 다시 입력하세요"
          />

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>비밀번호 요구사항:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>최소 8자 이상</li>
              <li>대문자, 소문자, 숫자, 특수문자 포함 권장</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsChangePasswordModalOpen(false);
                setPasswordForm({
                  current_password: '',
                  new_password: '',
                  confirm_password: '',
                });
              }}
            >
              취소
            </Button>
            <Button
              type="submit"
              loading={isLoading}
            >
              변경
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
