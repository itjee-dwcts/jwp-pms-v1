import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CalendarIcon,
  CheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TagIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { Task, TaskCreateRequest, TaskPriority, TaskStatus, TaskType, useTasks } from '../../hooks/useTasks';

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

interface TaskEditProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  taskId?: number;
}

const TaskEdit: React.FC<TaskEditProps> = ({
  isModal = false,
  onClose,
  onSuccess,
  onDelete,
  taskId: propTaskId,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const taskId = propTaskId || (id ? parseInt(id) : 0);

  const { getTask, updateTask, deleteTask, loading } = useTasks();
  const [task, setTask] = useState<Task | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      project_id: 0,
      status: 'todo',
      priority: 'medium',
      type: 'task',
      assignee_ids: [],
      tag_ids: [],
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  // 작업 데이터 로드
  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) {
        setIsLoadingTask(false);
        return;
      }

      try {
        setIsLoadingTask(true);
        const taskData = await getTask(taskId);
        setTask(taskData);

        // 폼 데이터 설정
        reset({
          title: taskData.title,
          description: taskData.description,
          project_id: taskData.project.id,
          status: taskData.status,
          priority: taskData.priority,
          type: taskData.type,
          due_date: taskData.due_date?.split('T')[0], // YYYY-MM-DD 형식으로 변환
          estimated_hours: taskData.estimated_hours,
          parent_task_id: taskData.parent_task?.id,
          assignee_ids: taskData.assignees.map(a => a.user.id),
          tag_ids: taskData.tags.map(t => t.id),
        });

        // 태그와 담당자 설정
        setSelectedTags(taskData.tags.map(t => t.id));
        setSelectedAssignees(taskData.assignees.map(a => a.user.id));

        // 상위 작업이 있으면 고급 설정 표시
        if (taskData.parent_task) {
          setShowAdvanced(true);
        }
      } catch (error) {
        console.error('Failed to load task:', error);
        toast.error('작업을 불러오는데 실패했습니다.');
        if (!isModal) {
          navigate('/tasks');
        }
      } finally {
        setIsLoadingTask(false);
      }
    };

    loadTask();
  }, [taskId, getTask, reset, navigate, isModal]);

  // 변경사항 감지
  useEffect(() => {
    setHasChanges(isDirty || selectedTags.join(',') !== task?.tags.map(t => t.id).join(',') ||
                 selectedAssignees.join(',') !== task?.assignees.map(a => a.user.id).join(','));
  }, [isDirty, selectedTags, selectedAssignees, task]);

  // 폼 제출 처리
  const onSubmit = async (data: TaskFormData) => {
    if (!taskId) return;

    try {
      // 변경된 데이터만 전송하기 위한 처리
      const updateData: Partial<TaskCreateRequest> = {};

      if (data.title !== task?.title) updateData.title = data.title;
      if (data.description !== task?.description) updateData.description = data.description;
      if (data.project_id !== task?.project.id) updateData.project_id = data.project_id;
      if (data.status !== task?.status) updateData.status = data.status;
      if (data.priority !== task?.priority) updateData.priority = data.priority;
      if (data.type !== task?.type) updateData.type = data.type;
      if (data.due_date !== task?.due_date?.split('T')[0]) updateData.due_date = data.due_date;
      if (data.estimated_hours !== task?.estimated_hours) updateData.estimated_hours = data.estimated_hours;
      if (data.parent_task_id !== task?.parent_task?.id) updateData.parent_task_id = data.parent_task_id;

      // 담당자와 태그는 항상 업데이트 (배열 비교가 복잡하므로)
      updateData.assignee_ids = selectedAssignees;
      updateData.tag_ids = selectedTags;

      const updatedTask = await updateTask(taskId, updateData);

      toast.success('작업이 성공적으로 수정되었습니다.');

      if (onSuccess) {
        onSuccess(updatedTask);
      }

      if (isModal && onClose) {
        onClose();
      } else {
        navigate(`/tasks/${taskId}`);
      }
    } catch (error) {
      console.error('Task update failed:', error);
      toast.error('작업 수정에 실패했습니다.');
    }
  };

  // 작업 삭제 처리
  const handleDelete = async () => {
    if (!taskId) return;

    try {
      await deleteTask(taskId);
      toast.success('작업이 삭제되었습니다.');

      if (onDelete) {
        onDelete(taskId);
      }

      if (isModal && onClose) {
        onClose();
      } else {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Task deletion failed:', error);
      toast.error('작업 삭제에 실패했습니다.');
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
    if (hasChanges) {
      if (window.confirm('변경사항이 저장되지 않습니다. 정말 나가시겠습니까?')) {
        if (isModal && onClose) {
          onClose();
        } else {
          navigate(-1);
        }
      }
    } else {
      if (isModal && onClose) {
        onClose();
      } else {
        navigate(-1);
      }
    }
  };

  // 로딩 상태
  if (isLoadingTask) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">작업 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 작업을 찾을 수 없는 경우
  if (!task) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          작업을 찾을 수 없습니다
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          요청한 작업이 존재하지 않거나 삭제되었습니다.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/tasks')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            작업 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

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
              title='수정'
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              작업 수정
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {task.title}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 변경사항 표시 */}
          {hasChanges && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <ArrowPathIcon className="h-3 w-3 mr-1" />
              변경사항 있음
            </span>
          )}

          {/* 삭제 버튼 */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 rounded-md"
            title="작업 삭제"
          >
            <TrashIcon className="h-5 w-5" />
          </button>

          {isModal && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              title="닫기"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
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
                    .filter(t => t.id !== taskId) // 자기 자신은 제외
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
        <div className="flex justify-between pt-6">
          <div>
            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 inline mr-2" />
              작업 삭제
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !isValid || !hasChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  수정 중...
                </div>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 inline mr-2" />
                  변경사항 저장
                </>
              )}
            </button>
          </div>
        </div>

        {/* 변경사항 요약 */}
        {hasChanges && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  변경사항이 있습니다
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>저장하지 않은 변경사항이 있습니다. 변경사항을 저장하거나 취소하세요.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 작업 정보 */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                작업 정보
              </h3>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>생성일: {new Date(task.created_at).toLocaleDateString('ko-KR')}</li>
                  <li>마지막 수정: {new Date(task.updated_at).toLocaleDateString('ko-KR')}</li>
                  <li>생성자: {task.creator.full_name}</li>
                  {task.comments_count > 0 && (
                    <li>댓글 수: {task.comments_count}개</li>
                  )}
                  {task.attachments_count > 0 && (
                    <li>첨부파일 수: {task.attachments_count}개</li>
                  )}
                  {task.subtasks_count > 0 && (
                    <li>하위 작업 수: {task.subtasks_count}개</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  작업 삭제 확인
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    '{task.title}' 작업을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </p>
                  {task.subtasks_count > 0 && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      주의: 이 작업에는 {task.subtasks_count}개의 하위 작업이 있습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskEdit;
