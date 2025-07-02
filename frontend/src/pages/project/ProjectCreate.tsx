import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/use-auth';
import { useProjects } from '@/hooks/use-projects';
import { useUsers } from '@/hooks/use-users';
import {
  ProjectCreateRequest,
  ProjectPriority,
  ProjectStatus
} from '@/types/project';
import { User } from '@/types/user';
import {
  ArrowLeftIcon,
  CalendarIcon,
  FolderIcon,
  PlusIcon,
  TagIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// 프로젝트 폼 데이터 인터페이스 (내부 폼 상태용)
interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date: string;
  budget: string;
  tags: string[];
  member_ids: number[];
}

/**
 * 프로젝트 생성 페이지 컴포넌트
 * 새로운 프로젝트를 생성하기 위한 폼을 제공합니다.
 */
const ProjectCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProject } = useProjects();
  const { getUsers } = useUsers();

  // 폼 데이터 상태
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: new Date().toISOString().split('T')[0] || '',
    end_date: '',
    budget: '',
    tags: [],
    member_ids: [],
  });

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  // 컴포넌트 마운트 시 사용자 목록 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * 사용자 목록을 가져오는 함수
   */
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const users = await getUsers();
      // 현재 사용자는 제외
      setAvailableUsers(users.filter((u: User) => u.id !== user?.id));
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
      toast.error('사용자 목록을 불러오는데 실패했습니다');
    } finally {
      setUsersLoading(false);
    }
  };

  /**
   * 폼 유효성 검사
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 프로젝트명 검증
    if (!formData.name.trim()) {
      newErrors.name = '프로젝트명은 필수 입력사항입니다';
    } else if (formData.name.length < 3) {
      newErrors.name = '프로젝트명은 최소 3글자 이상이어야 합니다';
    } else if (formData.name.length > 100) {
      newErrors.name = '프로젝트명은 100글자를 초과할 수 없습니다';
    }

    // 설명 검증
    if (!formData.description.trim()) {
      newErrors.description = '프로젝트 설명은 필수 입력사항입니다';
    } else if (formData.description.length < 10) {
      newErrors.description = '설명은 최소 10글자 이상이어야 합니다';
    }

    // 날짜 검증
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate <= startDate) {
        newErrors.end_date = '종료일은 시작일보다 늦어야 합니다';
      }
    }

    // 예산 검증
    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = '예산은 유효한 숫자여야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 폼 제출 처리
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('폼에 오류가 있습니다. 확인해주세요');
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const projectData: ProjectCreateRequest = {
        ...formData,
        status: formData.status as ProjectStatus,
        priority: formData.priority as ProjectPriority,
        ...(formData.budget !== '' && { budget: parseFloat(formData.budget) }),
        ...(formData.end_date !== '' && { end_date: formData.end_date }),
      };

      const newProject = await createProject(projectData);
      toast.success('프로젝트가 성공적으로 생성되었습니다!');
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다';
      toast.error(errorMessage);

      // 백엔드 유효성 검사 오류 처리
      if (errorMessage.toLowerCase().includes('name')) {
        setErrors({ name: '이미 존재하는 프로젝트명입니다' });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 입력 필드 변경 핸들러
   */
  const handleInputChange = (field: keyof ProjectFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

    // 해당 필드의 오류 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * 태그 추가
   */
  const addTag = () => {
    if (!newTag.trim()) return;

    const trimmedTag = newTag.trim().toLowerCase();
    if (!formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
    setNewTag('');
  };

  /**
   * 태그 제거
   */
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  /**
   * 팀원 추가
   */
  const addMember = (userId: number) => {
    if (!formData.member_ids.includes(userId)) {
      setFormData(prev => ({
        ...prev,
        member_ids: [...prev.member_ids, userId]
      }));
    }
    setShowUserSearch(false);
    setSearchTerm('');
  };

  /**
   * 팀원 제거
   */
  const removeMember = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      member_ids: prev.member_ids.filter(id => id !== userId)
    }));
  };

  // 필터링된 사용자 목록
  const filteredUsers = availableUsers.filter(user =>
    !formData.member_ids.includes(user.id) &&
    (user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 선택된 팀원 목록
  const selectedMembers = availableUsers.filter(user =>
    formData.member_ids.includes(user.id)
  );

  /**
   * 상태별 색상 반환
   */
  const getStatusColor = (status: ProjectStatus) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  /**
   * 우선순위별 색상 반환
   */
  const getPriorityColor = (priority: string) => {
    const colors = {
      "low": 'bg-green-100 text-green-800',
      "medium": 'bg-yellow-100 text-yellow-800',
      "high": 'bg-orange-100 text-orange-800',
      "critical": 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              새 프로젝트 만들기
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              팀의 업무를 관리할 새로운 프로젝트를 설정하세요
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <FolderIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              기본 정보
            </h2>
          </div>

          <div className="space-y-6">
            {/* 프로젝트명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                프로젝트명 *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="프로젝트명을 입력하세요"
                disabled={loading}
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.name.length}/100 글자
              </p>
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                설명 *
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={handleInputChange('description')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="프로젝트에 대한 설명을 입력하세요"
                disabled={loading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description}
                </p>
              )}
            </div>

            {/* 상태 및 우선순위 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  disabled={loading}
                >
                  <option value="planning">계획 중</option>
                  <option value="active">진행 중</option>
                  <option value="on_hold">대기</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  우선순위
                </label>
                <select
                  value={formData.priority}
                  onChange={handleInputChange('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  disabled={loading}
                >
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                  <option value="critical">긴급</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* 일정 및 예산 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              일정 및 예산
            </h2>
          </div>

          <div className="space-y-6">
            {/* 시작일 및 종료일 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시작일
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange('start_date')}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  종료일
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange('end_date')}
                  className={errors.end_date ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.end_date}
                  </p>
                )}
              </div>
            </div>

            {/* 예산 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                예산 (선택사항)
              </label>
              <Input
                type="number"
                value={formData.budget}
                onChange={handleInputChange('budget')}
                className={errors.budget ? 'border-red-500' : ''}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={loading}
              />
              {errors.budget && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.budget}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* 태그 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TagIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              태그
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="태그를 입력하세요"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                disabled={loading}
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                disabled={loading || !newTag.trim()}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      disabled={loading}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 팀원 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              팀원
            </h2>
          </div>

          <div className="space-y-4">
            {/* 팀원 검색 */}
            <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="팀원을 검색하세요..."
                onFocus={() => setShowUserSearch(true)}
                disabled={loading || usersLoading}
              />

              {showUserSearch && searchTerm && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addMember(user.id)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3"
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 선택된 팀원 목록 */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  선택된 팀원 ({selectedMembers.length}명)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                    >
                      {member.full_name}
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="ml-2 text-green-600 hover:text-green-800"
                        disabled={loading}
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/projects')}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            <span>{loading ? '생성 중...' : '프로젝트 생성'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreate;
