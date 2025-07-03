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
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../hooks/useUser';
import { ChangePasswordRequest, UpdateProfileRequest } from '../../types/user';

/**
 * 사용자 프로필 페이지 컴포넌트
 * 현재 로그인한 사용자의 프로필 정보를 보여주고 편집할 수 있는 페이지
 */
const Profile: React.FC = () => {
  const { user } = useAuth();
  const { updateProfile, changePassword, uploadAvatar, isLoading } = useUser();

  // 편집 모드 상태 관리
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // 프로필 편집 폼 상태
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  // 비밀번호 변경 폼 상태
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // 파일 업로드 참조
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.error('Profile update error:', error);
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

    try {
      await changePassword(passwordForm);
      setIsChangePasswordModalOpen(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
    } catch (error) {
      toast.error('비밀번호 변경에 실패했습니다.');
      console.error('Password change error:', error);
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
      await uploadAvatar(file);
      toast.success('프로필 이미지가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      toast.error('프로필 이미지 업로드에 실패했습니다.');
      console.error('Avatar upload error:', error);
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
  const updatePasswordField = (field: keyof ChangePasswordRequest, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
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
                    value={profileForm.full_name}
                    onChange={(e) => updateProfileField('full_name', e.target.value)}
                    icon={<UserIcon className="w-5 h-5" />}
                    required
                  />
                  <Input
                    label="이메일"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => updateProfileField('email', e.target.value)}
                    icon={<EnvelopeIcon className="w-5 h-5" />}
                    required
                  />
                  <Input
                    label="전화번호"
                    value={profileForm.phone || ''}
                    onChange={(e) => updateProfileField('phone', e.target.value)}
                    icon={<PhoneIcon className="w-5 h-5" />}
                  />
                  <Input
                    label="위치"
                    value={profileForm.location || ''}
                    onChange={(e) => updateProfileField('location', e.target.value)}
                    icon={<MapPinIcon className="w-5 h-5" />}
                  />
                </div>

                <Input
                  label="웹사이트"
                  value={profileForm.website || ''}
                  onChange={(e) => updateProfileField('website', e.target.value)}
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
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileForm({
                        full_name: user.full_name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        bio: user.bio || '',
                        location: user.location || '',
                        website: user.website || '',
                      });
                    }}
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
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">역할</p>
                      <Badge variant="primary">{user.role}</Badge>
                    </div>
                  </div>
                </div>

                {user.bio && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">소개</p>
                    <p className="text-gray-900 dark:text-white">{user.bio}</p>
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
                src={user.avatar_url}
                alt={user.full_name || user.email}
                size="xl"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors"
              >
                <CameraIcon className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
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
                  {user.project_count || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">완료한 작업</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.completed_tasks_count || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700 dark:text-gray-300">진행 중인 작업</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.active_tasks_count || 0}
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
          />

          <Input
            label="새 비밀번호"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => updatePasswordField('new_password', e.target.value)}
            required
            minLength={8}
          />

          <Input
            label="새 비밀번호 확인"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => updatePasswordField('confirm_password', e.target.value)}
            required
            minLength={8}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsChangePasswordModalOpen(false)}
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
