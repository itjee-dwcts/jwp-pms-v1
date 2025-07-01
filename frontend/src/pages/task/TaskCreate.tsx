import {
  ArrowLeftIcon,
  CalendarIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  TagIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TaskCreateRequest, TaskPriority, TaskStatus, TaskType, useTasks } from '../../hooks/useTasks';

// Mock data - 실제 환경에서는 API에서 가져와야 함
const mockProjects = [
  { id: 1, name: '웹사이트 리뉴얼 프로젝트', description: '회사 웹사이트 전면 개편' },
  { id: 2, name: '모바일 앱 개발', description: 'iOS/Android 앱 개발' },
  { id: 3, name: 'AI 챗봇 구축', description: '고객 서비스 AI 챗봇' },
];

const mockUsers = [
  { id: 1, username: 'kim_dev', full_name: '김주임', email: 'kim.dev@company.com' },
  { id: 2, username: 'lee_design', full_name: '이대리', email: 'lee.design@company.com' },
  { id: 3, username: 'park_pm', full_name: '박과장', email: 'park.pm@company.com' },
  { id: 4, username: 'choi_backend', full_name: '최차장', email: 'choi.backend@company.com' },
];

const mockTasks = [
  { id: 1, title: 'UI/UX 디자인 시스템 구축', status: 'in_progress' as TaskStatus },
  { id: 2, title: 'API 서버 개발', status: 'todo' as TaskStatus },
  { id: 3, title: '데이터베이스 설계', status: 'done' as TaskStatus },
];

const mockTags = [
  { id: 1, name: 'frontend', color: '#3B82F6' },
  { id: 2, name: 'backend', color: '#10B981' },
  { id: 3, name: 'design', color: '#8B5CF6' },
  { id: 4, name: 'urgent', color: '#EF4444' },
  { id: 5, name: 'bug', color: '#F59E0B' },
];

interface TaskFormData {
  title: string;
  description: string;
  project_id: number;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  due_date?: string;
  estimated_hours?: number;
  parent_task_id?: number;
  assignee_ids: number[];
  tag_ids: number[];
}

interface TaskCreateProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: (task: any) => void;
  defaultProjectId?: number;
  defaultParentTaskId?: number;
}

const TaskCreate: React.FC<TaskCreateProps> = ({
  isModal = false,
  onClose,
  onSuccess,
  defaultProjectId,
  defaultParentTaskId,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createTask, loading } = useTasks();
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      project_id: defaultProjectId || parseInt(searchParams.get('project') || '0') || 0,
      status: 'todo',
      priority: 'medium',
      type: 'task',
      assignee_ids: [],
      tag_ids: [],
    },
    mode: 'onChange',
  });

  const watchedProjectId = watch('project_id');
  const watchedType = watch('type');

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    const projectParam = searchParams.get('project');
    const parentTaskParam = searchParams.get('parent');

    if (projectParam) {
      setValue('project_id', parseInt(projectParam));
    }
    if (parentTaskParam || defaultParentTaskId) {
      setValue('parent_task_id', parseInt(parentTaskParam || String(defaultParentTaskId)));
      setShowAdvanced(true);
    }
  }, [searchParams, setValue, defaultParentTaskId]);

  // 폼 제출 처리
  const onSubmit = async (data: TaskFormData) => {
    try {
      // 빈 값들 제거
      const cleanData: TaskCreateRequest = {
        ...data,
        assignee_ids: selectedAssignees,
        tag_ids: selectedTags,
        due_date: data.due_date || undefined,
        estimated_hours: data.estimated_hours || undefined,
        parent_task_id: data.parent_task_id || undefined,
      };

      const newTask = await createTask(cleanData);

      toast.success('작업이 성공적으로 생성되었습니다.');

      if (onSuccess) {
        onSuccess(newTask);
      }

      if (isModal && onClose) {
        onClose();
      } else {
        navigate(`/tasks/${newTask.id}`);
      }
    } catch (error) {
      console.error('Task creation failed:', error);
      toast.error('작업 생성에 실패했습니다.');
    }
  };

  // 태그 토글
  const toggleTag = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // 담당자 토글
  const toggleAssignee = (userId: number) => {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // 뒤로가기 처리
  const handleCancel = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const containerClassName = isModal
    ? "bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto max-h-[90vh] overflow-y-auto"
    : "space-y-6";

  return (
    <div className={containerClassName}>
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center space-x-3">
          {!isModal && (
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              새 작업 생성
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              프로젝트에 새로운 작업을 추가하세요
            </p>
          </div>
        </div>

        {isModal && (
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            기본 정보
          </h3>

          <div className="space-y-4">
            {/* 작업 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                작업 제목 *
              </label>
              <input
                {...register('title', {
                  required: '작업 제목을 입력해주세요',
                  minLength: { value: 3, message: '최소 3자 이상 입력해주세요' }
                })}
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="작업 제목을 입력하세요"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* 프로젝트 선택 */}
            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                프로젝트 *
              </label>
              <select
                {...register('project_id', {
                  required: '프로젝트를 선택해주세요',
                  min: { value: 1, message: '프로젝트를 선택해주세요' }
                })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={0}>프로젝트를 선택하세요</option>
                {mockProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.project_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.project_id.message}
                </p>
              )}
            </div>

            {/* 작업 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                작업 설명
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="작업에 대한 상세 설명을 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* 작업 속성 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            작업 속성
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 작업 상태 */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                상태
              </label>
              <select
                {...register('status')}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="todo">할 일</option>
                <option value="in_progress">진행 중</option>
                <option value="in_review">검토 중</option>
                <option value="done">완료</option>
              </select>
            </div>

            {/* 우선순위 */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                우선순위
              </label>
              <select
                {...register('priority')}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="critical">긴급</option>
              </select>
            </div>

            {/* 작업 유형 */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                유형
              </label>
              <select
                {...register('type')}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="task">일반 작업</option>
                <option value="bug">버그</option>
                <option value="feature">기능</option>
                <option value="improvement">개선</option>
                <option value="research">연구</option>
              </select>
            </div>
          </div>
        </div>

        {/* 일정 및 시간 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            일정 및 시간
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 마감일 */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                마감일
              </label>
              <input
                {...register('due_date')}
                type="date"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* 예상 시간 */}
            <div>
              <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                예상 시간 (시간)
              </label>
              <input
                {...register('estimated_hours', {
                  min: { value: 0.5, message: '최소 0.5시간 이상이어야 합니다' },
                  max: { value: 1000, message: '최대 1000시간까지 입력 가능합니다' }
                })}
                type="number"
                step="0.5"
                min="0.5"
                max="1000"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="예상 소요 시간"
              />
              {errors.estimated_hours && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.estimated_hours.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 담당자 및 태그 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            담당자 및 태그
          </h3>

          <div className="space-y-4">
            {/* 담당자 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                담당자
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {mockUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(user.id)}
                      onChange={() => toggleAssignee(user.id)}
                      className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 태그 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                태그
              </label>
              <div className="flex flex-wrap gap-2">
                {mockTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'border-transparent text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                    }}
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 고급 설정 (선택적) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              고급 설정
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {showAdvanced ? '숨기기' : '표시'}
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {/* 상위 작업 */}
              <div>
                <label htmlFor="parent_task_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  상위 작업
                </label>
                <select
                  {...register('parent_task_id')}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">상위 작업 없음</option>
                  {mockTasks
                    .filter(task => watchedProjectId ? true : false) // 실제로는 선택된 프로젝트의 작업만 표시
                    .map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  이 작업이 다른 작업의 하위 작업인 경우 선택하세요
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                생성 중...
              </div>
            ) : (
              '작업 생성'
            )}
          </button>
        </div>

        {/* 도움말 */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                작업 생성 팁
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>명확하고 구체적인 작업 제목을 작성하세요</li>
                  <li>작업의 완료 조건을 설명에 포함하세요</li>
                  <li>적절한 담당자와 마감일을 설정하세요</li>
                  <li>관련 태그를 추가하여 작업을 분류하세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TaskCreate;
