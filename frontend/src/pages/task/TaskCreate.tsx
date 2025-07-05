import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/use-auth';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useUsers } from '@/hooks/use-users';
import { User } from '@/types/auth';
import {
  TaskCreateRequest,
} from '@/types/task';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlusIcon,
  TagIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

// 작업 폼 데이터 인터페이스 (내부 폼 상태용)
interface TaskFormData {
  title: string;
  description: string;
  project_id: string;
  status: string;
  priority: string;
  type: string;
  due_date: string;
  estimated_hours: string;
  parent_task_id: string;
  assignee_ids: string[];
  tags: string[];
}

/**
 * 작업 생성 페이지 컴포넌트
 * 새로운 작업을 생성하기 위한 폼을 제공합니다.
 */
const TaskCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useAuth();
  const { createTask } = useTasks();
  const { getProjects } = useProjects();
  const { getUsers } = useUsers();

  // 폼 데이터 상태
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    project_id: searchParams.get('project_id') || '',
    status: 'todo',
    priority: 'medium',
    type: 'task',
    due_date: '',
    estimated_hours: '',
    parent_task_id: '',
    assignee_ids: [],
    tags: [],
  });

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  /**
   * 프로젝트 목록을 가져오는 함수
   */
  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await getProjects({ page_size: 100 });
      setProjects(response.projects);
    } catch (error) {
      console.error('프로젝트 목록 로드 실패:', error);
      toast.error('프로젝트 목록을 불러오는데 실패했습니다');
    } finally {
      setProjectsLoading(false);
    }
  };

  /**
   * 사용자 목록을 가져오는 함수
   */
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const users = await getUsers();
      setAvailableUsers(users);
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

    // 제목 검증
    if (!formData.title.trim()) {
      newErrors.title = '작업 제목은 필수 입력사항입니다';
    } else if (formData.title.length < 3) {
      newErrors.title = '작업 제목은 최소 3글자 이상이어야 합니다';
    } else if (formData.title.length > 200) {
      newErrors.title = '작업 제목은 200글자를 초과할 수 없습니다';
    }

    // 설명 검증
    if (!formData.description.trim()) {
      newErrors.description = '작업 설명은 필수 입력사항입니다';
    } else if (formData.description.length < 10) {
      newErrors.description = '설명은 최소 10글자 이상이어야 합니다';
    }

    // 프로젝트 검증
    if (!formData.project_id) {
      newErrors.project_id = '프로젝트를 선택해주세요';
    }

    // 예상 시간 검증
    if (formData.estimated_hours && (isNaN(Number(formData.estimated_hours)) || Number(formData.estimated_hours) < 0)) {
      newErrors.estimated_hours = '예상 시간은 0 이상의 숫자여야 합니다';
    }

    // 마감일 검증
    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.due_date = '마감일은 오늘 이후여야 합니다';
      }
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

      const taskData: TaskCreateRequest = {
        title: formData.title,
        description: formData.description,
        project_id: formData.project_id,
        status: formData.status,
        priority: formData.priority,
        type: formData.type,
        ...(formData.due_date && { due_date: formData.due_date }),
        ...(formData.estimated_hours && { estimated_hours: parseFloat(formData.estimated_hours) }),
        ...(formData.parent_task_id && { parent_task_id: formData.parent_task_id }),
        ...(formData.assignee_ids.length > 0 && { assignee_ids: formData.assignee_ids }),
        ...(formData.tags.length > 0 && { tag_ids: formData.tags.map(tag => tag) }),
      };

      const newTask = await createTask(taskData);
      toast.success('작업이 성공적으로 생성되었습니다!');
      navigate(`/tasks/${newTask.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '작업 생성에 실패했습니다';
      toast.error(errorMessage);

      // 백엔드 유효성 검사 오류 처리
      if (errorMessage.toLowerCase().includes('title')) {
        setErrors({ title: '이미 존재하는 작업 제목입니다' });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 입력 필드 변경 핸들러
   */
  const handleInputChange = (field: keyof TaskFormData) => (
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
   * 담당자 추가
   */
  const addAssignee = (userId: string) => {
    if (!formData.assignee_ids.includes(userId)) {
      setFormData(prev => ({
        ...prev,
        assignee_ids: [...prev.assignee_ids, userId]
      }));
    }
    setShowUserSearch(false);
    setSearchTerm('');
  };

  /**
   * 담당자 제거
   */
  const removeAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.filter(id => id !== userId)
    }));
  };

  // 필터링된 사용자 목록
  const filteredUsers = availableUsers.filter(user =>
    !formData.assignee_ids.includes(user.id) &&
    (user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 선택된 담당자 목록
  const selectedAssignees = availableUsers.filter(user =>
    formData.assignee_ids.includes(user.id)
  );

  // 선택된 프로젝트 정보
  const selectedProject = projects.find(p => p.id.toString() === formData.project_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/tasks')}
            className="p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              새 작업 만들기
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              팀의 업무를 추적할 새로운 작업을 생성하세요
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CheckCircleIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              기본 정보
            </h2>
          </div>

          <div className="space-y-6">
            {/* 프로젝트 선택 */}
            <div>
              <label htmlFor="task-project-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                프로젝트 *
              </label>
              <select
                id="task-project-select"
                value={formData.project_id}
                onChange={handleInputChange('project_id')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                  errors.project_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading || projectsLoading}
              >
                <option value="">프로젝트를 선택하세요</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.project_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.project_id}
                </p>
              )}
              {selectedProject && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  📁 {selectedProject.description}
                </p>
              )}
            </div>

            {/* 작업 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                작업 제목 *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={handleInputChange('title')}
                className={errors.title ? 'border-red-500' : ''}
                placeholder="작업 제목을 입력하세요"
                disabled={loading}
                maxLength={200}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.title}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.title.length}/200 글자
              </p>
            </div>

            {/* 작업 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                작업 설명 *
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={handleInputChange('description')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="작업에 대한 상세한 설명을 입력하세요"
                disabled={loading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description}
                </p>
              )}
            </div>

            {/* 상태, 우선순위, 타입 */}
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="task-status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태
                </label>
                <select
                  id="task-status-select"
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  disabled={loading}
                >
                  <option value="todo">할 일</option>
                  <option value="in_progress">진행 중</option>
                  <option value="in_review">검토 중</option>
                  <option value="done">완료</option>
                </select>
              </div>

              <div>
                <label htmlFor="task-priority-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  우선순위
                </label>
                <select
                  id="task-priority-select"
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

              <div>
                <label htmlFor="task-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  타입
                </label>
                <select
                  id="task-type-select"
                  value={formData.type}
                  onChange={handleInputChange('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  disabled={loading}
                >
                  <option value="task">작업</option>
                  <option value="bug">버그</option>
                  <option value="feature">기능</option>
                  <option value="improvement">개선</option>
                  <option value="research">연구</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* 일정 및 시간 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              일정 및 시간
            </h2>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* 마감일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  마감일 (선택사항)
                </label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={handleInputChange('due_date')}
                  className={errors.due_date ? 'border-red-500' : ''}
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.due_date}
                  </p>
                )}
              </div>

              {/* 예상 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  예상 시간 (시간, 선택사항)
                </label>
                <Input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={handleInputChange('estimated_hours')}
                  className={errors.estimated_hours ? 'border-red-500' : ''}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  disabled={loading}
                />
                {errors.estimated_hours && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.estimated_hours}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 담당자 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              담당자
            </h2>
          </div>

          <div className="space-y-4">
            {/* 담당자 검색 */}
            <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="담당자를 검색하세요..."
                onFocus={() => setShowUserSearch(true)}
                disabled={loading || usersLoading}
              />

              {showUserSearch && searchTerm && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addAssignee(user.id)}
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

            {/* 선택된 담당자 목록 */}
            {selectedAssignees.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  선택된 담당자 ({selectedAssignees.length}명)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAssignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                    >
                      {assignee.full_name}
                      <button
                        type="button"
                        onClick={() => removeAssignee(assignee.id)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        disabled={loading}
                        title={assignee.full_name}
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
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-gray-600 hover:text-gray-800"
                      disabled={loading}
                      title={tag}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/tasks')}
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
            <span>{loading ? '생성 중...' : '작업 생성'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreate;
