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
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ErrorMessage from '../../components/ui/ErrorMessage';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useProjects } from '../../hooks/use-projects';
import { useTasks } from '../../hooks/use-tasks';
import { useUsers } from '../../hooks/use-users';
import { User } from '../../types/auth';
import {
  Task,
  TaskUpdateRequest
} from '../../types/task';

// 작업 폼 데이터 인터페이스 (내부 폼 상태용)
interface TaskFormData {
  title: string;
  description: string;
  project_id: string;
  status: string;
  priority: string;
  type: string;
  start_date: string;
  end_date: string;
  estimated_days: string;
  parent_task_id: string;
  assignee_ids: string[];
  tags: string[];
}

/**
 * 작업 수정 페이지 컴포넌트
 * 기존 작업의 정보를 수정할 수 있는 폼을 제공합니다.
 */
const TaskEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTask, updateTask } = useTasks();
  const { getProjects } = useProjects();
  const { getUsers } = useUsers();

  // 폼 데이터 상태
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    project_id: '',
    status: 'todo',
    priority: 'medium',
    type: 'task',
    start_date: '',
    end_date: '',
    estimated_days: '',
    parent_task_id: '',
    assignee_ids: [],
    tags: [],
  });

  // UI 상태
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (id) {
      fetchTask();
      fetchProjects();
      fetchUsers();
    }
  }, [id]);

  // 폼 데이터 변경 감지
  useEffect(() => {
    if (task) {
      const hasChanges =
        formData.title !== task.title ||
        formData.description !== task.description ||
        formData.project_id !== task.project.id.toString() ||
        formData.status !== task.status ||
        formData.priority !== task.priority ||
        formData.type !== task.type ||
        formData.start_date !== (task.start_date || '') ||
        formData.end_date !== (task.end_date || '') ||
        formData.estimated_days !== (task.estimated_days?.toString() || '') ||
        JSON.stringify(formData.assignee_ids.sort()) !== JSON.stringify(task.assignees.map(a => a.user.id).sort()) ||
        JSON.stringify(formData.tags) !== JSON.stringify(task.tags?.map(t => t.name) || []);

      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, task]);

  /**
   * 작업 정보 가져오기
   */
  const fetchTask = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const taskData = await getTask(id);
      setTask(taskData);

      // 폼 데이터 초기화
      setFormData({
        title: taskData.title,
        description: taskData.description,
        project_id: taskData.project.id.toString(),
        status: taskData.status,
        priority: taskData.priority,
        type: taskData.type,
        start_date: taskData.start_date || '',
        end_date: taskData.end_date || '',
        estimated_days: taskData.estimated_days?.toString() || '',
        parent_task_id: taskData.parent_task?.id.toString() || '',
        assignee_ids: taskData.assignees.map(assignee => assignee.user.id),
        tags: taskData.tags?.map(tag => tag.name) || [],
      });
    } catch (error) {
      console.error('작업 로드 실패:', error);
      toast.error('작업을 불러오는데 실패했습니다');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

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
    if (formData.estimated_days && (isNaN(Number(formData.estimated_days)) || Number(formData.estimated_days) < 0)) {
      newErrors.estimated_days = '예상 기간은 0 이상의 숫자여야 합니다';
    }
    if (formData.end_date && formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      newErrors.end_date = '종료일은 시작일 이후여야 합니다';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 폼 제출 처리
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !task) {
      toast.error('폼에 오류가 있습니다. 확인해주세요');
      return;
    }

    try {
      setSaveLoading(true);
      setErrors({});

      const updateData: TaskUpdateRequest = {
        id: task.id,
        title: formData.title,
        description: formData.description,
        project_id: formData.project_id,
        status: formData.status,
        priority: formData.priority,
        type: formData.type,
        ...(formData.start_date && { start_date: formData.start_date }),
        ...(formData.end_date && { end_date: formData.end_date }),
        ...(formData.estimated_days && { estimated_days: parseFloat(formData.estimated_days) }),
        ...(formData.parent_task_id && { parent_task_id: formData.parent_task_id }),
        ...(formData.assignee_ids.length > 0 && { assignee_ids: formData.assignee_ids }),
        ...(formData.tags.length > 0 && { tag_ids: formData.tags }),
      };

      await updateTask(task.id, updateData);
      toast.success('작업이 성공적으로 수정되었습니다!');
      setHasUnsavedChanges(false);
      navigate(`/tasks/${task.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '작업 수정에 실패했습니다';
      toast.error(errorMessage);

      // 백엔드 유효성 검사 오류 처리
      if (errorMessage.toLowerCase().includes('title')) {
        setErrors({ title: '이미 존재하는 작업 제목입니다' });
      }
    } finally {
      setSaveLoading(false);
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

  /**
   * 취소 버튼 클릭 처리
   */
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?')) {
        navigate(`/tasks/${task?.id}`);
      }
    } else {
      navigate(`/tasks/${task?.id}`);
    }
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

  // 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 작업을 찾을 수 없음
  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorMessage message="작업을 찾을 수 없습니다" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/tasks/${task.id}`)}
            className="p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              작업 수정
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              작업 정보와 설정을 업데이트하세요
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              저장되지 않은 변경사항
            </span>
          )}
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
                disabled={saveLoading || projectsLoading}
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
                disabled={saveLoading}
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
                disabled={saveLoading}
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
                  disabled={saveLoading}
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
                  disabled={saveLoading}
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
                  disabled={saveLoading}
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
              {/* 시작일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시작일 (선택사항)
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange('start_date')}
                  className={errors.start_date ? 'border-red-500' : ''}
                  disabled={saveLoading}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.start_date}
                  </p>
                )}
              </div>
              {/* 종료일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  종료일 (선택사항)
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange('end_date')}
                  className={errors.end_date ? 'border-red-500' : ''}
                  disabled={saveLoading}
                  min={formData.start_date || undefined}
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.end_date}
                  </p>
                )}
              </div>
              {/* 예상 기간(일) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  예상 기간 (일, 선택사항)
                </label>
                <Input
                  type="number"
                  value={formData.estimated_days}
                  onChange={handleInputChange('estimated_days')}
                  className={errors.estimated_days ? 'border-red-500' : ''}
                  placeholder="0"
                  min="0"
                  step="1"
                  disabled={saveLoading}
                />
                {errors.estimated_days && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.estimated_days}
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
                disabled={saveLoading || usersLoading}
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
                        disabled={saveLoading}
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
                disabled={saveLoading}
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                disabled={saveLoading || !newTag.trim()}
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
                      disabled={saveLoading}
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
            onClick={handleCancel}
            disabled={saveLoading}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={saveLoading || !hasUnsavedChanges}
            className="flex items-center space-x-2"
          >
            {saveLoading && <LoadingSpinner size="sm" />}
            <span>{saveLoading ? '저장 중...' : '변경사항 저장'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskEdit;
