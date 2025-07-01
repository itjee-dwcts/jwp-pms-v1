import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import {
  CameraIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ProfileFormData {
  username: string;
  email: string;
  full_name: string;
  bio: string;
  phone: string;
  location: string;
  website: string;
  timezone: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  task_reminders: boolean;
  project_updates: boolean;
  calendar_reminders: boolean;
  weekly_digest: boolean;
}

const Profile: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    username: '',
    email: '',
    full_name: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
    timezone: 'UTC',
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    task_reminders: true,
    project_updates: true,
    calendar_reminders: true,
    weekly_digest: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        website: user.website || '',
        timezone: user.timezone || 'UTC',
      });
    }
  }, [user]);

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (profileData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!profileData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (profileData.website && !/^https?:\/\/.+/.test(profileData.website)) {
      newErrors.website = 'Website must be a valid URL (include http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.new_password)) {
      newErrors.new_password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!passwordData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      await updateProfile(profileData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);

      if (errorMessage.toLowerCase().includes('username')) {
        setErrors({ username: 'Username is already taken' });
      } else if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ email: 'Email is already registered' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });

      toast.success('Password changed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      toast.error(errorMessage);

      if (errorMessage.toLowerCase().includes('current password')) {
        setErrors({ current_password: 'Current password is incorrect' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      // TODO: Implement notification settings update API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Notification settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileInputChange = (field: keyof ProfileFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfileData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordInputChange = (field: keyof PasswordFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNotificationChange = (field: keyof NotificationSettings) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNotificationSettings(prev => ({ ...prev, [field]: e.target.checked }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Picture */}
      <Card className="p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`${user.full_name}`}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <button
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
              title="카메라">
              <CameraIcon className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.full_name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Member since {new Date(user.created_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Profile', icon: UserIcon },
            { id: 'password', label: 'Password', icon: LockClosedIcon },
            { id: 'notifications', label: 'Notifications', icon: EnvelopeIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <Input
                  type="text"
                  value={profileData.username}
                  onChange={handleProfileInputChange('username')}
                  className={errors.username ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileInputChange('email')}
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  전체이름
                </label>
                <Input
                  type="text"
                  value={profileData.full_name}
                  onChange={handleProfileInputChange('full_name')}
                  className={errors.full_name ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  전화번호
                </label>
                <Input
                  type="tel"
                  value={profileData.phone}
                  onChange={handleProfileInputChange('phone')}
                  disabled={loading}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  위치
                </label>
                <Input
                  type="text"
                  value={profileData.location}
                  onChange={handleProfileInputChange('location')}
                  disabled={loading}
                />
              </div>

              {/* Website */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  웹사이트
                </label>
                <Input
                  type="url"
                  value={profileData.website}
                  onChange={handleProfileInputChange('website')}
                  className={errors.website ? 'border-red-500' : ''}
                  placeholder="https://example.com"
                  disabled={loading}
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.website}
                  </p>
                )}
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  타임존
                </label>
                <select
                  value={profileData.timezone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  disabled={loading}
                  title="타임존"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Seoul">Seoul</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                건강
              </label>
              <textarea
                rows={4}
                value={profileData.bio}
                onChange={handleProfileInputChange('bio')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Tell us about yourself..."
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    업데이트하는중...
                  </>
                ) : (
                  '프로필 저장'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card className="p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                현재 비밀번호
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.current_password}
                  onChange={handlePasswordInputChange('current_password')}
                  className={`pr-10 ${errors.current_password ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.current_password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.current_password}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                변경 비밀번호
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={handlePasswordInputChange('new_password')}
                  className={`pr-10 ${errors.new_password ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.new_password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                변경 비밀번호 확인
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirm_password}
                  onChange={handlePasswordInputChange('confirm_password')}
                  className={`pr-10 ${errors.confirm_password ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirm_password}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    변경하는중...
                  </>
                ) : (
                  '비밀번호 변경'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card className="p-6">
          <form onSubmit={handleNotificationSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'email_notifications', label: 'Email notifications', description: 'Receive notifications via email' },
                  { key: 'push_notifications', label: 'Push notifications', description: 'Receive browser push notifications' },
                  { key: 'task_reminders', label: 'Task reminders', description: 'Get reminded about upcoming task deadlines' },
                  { key: 'project_updates', label: 'Project updates', description: 'Notifications about project changes and updates' },
                  { key: 'calendar_reminders', label: 'Calendar reminders', description: 'Reminders for calendar events' },
                  { key: 'weekly_digest', label: 'Weekly digest', description: 'Weekly summary of your activities and tasks' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={setting.key}
                        type="checkbox"
                        checked={notificationSettings[setting.key as keyof NotificationSettings]}
                        onChange={handleNotificationChange(setting.key as keyof NotificationSettings)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={setting.key} className="font-medium text-gray-700 dark:text-gray-300">
                        {setting.label}
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">{setting.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  '설정 저장'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Profile;
