import {
  ArrowLeftIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  LinkIcon,
  PaperClipIcon,
  PencilIcon,
  PlayIcon,
  TagIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ErrorMessage from '../../components/ui/ErrorMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/use-auth';
import { useTasks } from '../../hooks/use-tasks';
import { Task } from '../../types/task';

/**
 * 작업 상세 페이지 컴포넌트
 * 특정 작업의 상세 정보와 관련 데이터들을 표시합니다.
 */
const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTask, deleteTask, updateTaskStatus } = useTasks();

  // 상태 관리
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

  /**
   * 작업 정보 가져오기
   */
  const fetchTask = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const taskData = await getTask(id);
      setTask(taskData);
    } catch (error) {
      console.error('작업 로드 실패:', error);
      toast.error('작업을 불러오는데 실패했습니다');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 작업 삭제 처리
   */
  const handleDelete = async () => {
    if (!task) return;

    try {
      setDeleteLoading(true);
      await deleteTask(task.id);
      toast.success('작업이 삭제되었습니다');
      navigate('/tasks');
    } catch (error) {
      console.error('작업 삭제 실패:', error);
      toast.error('작업 삭제에 실패했습니다');
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  /**
   * 작업 상태 변경
   */
  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    try {
      setStatusLoading(true);
      await updateTaskStatus(task.id, newStatus);
      setTask(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success('작업 상태가 변경되었습니다');
    } catch (error) {
      console.error('상태 변경 실패:', error);
      toast.error('상태 변경에 실패했습니다');
    } finally {
      setStatusLoading(false);
    }
  };

  /**
   * 사용자가 작업 담당자인지 확인
   */
  const isAssignee = task?.assignees.some(assignee => assignee.user.id === user?.id);

  /**
   * 사용자가 작업 생성자인지 확인
   */
  const isCreator = task?.creator.id === user?.id;

  /**
   * 사용자가 작업을 수정할 수 있는지 확인
   */
  const canEdit = isAssignee || isCreator;

  /**
   * 상태별 색상 반환
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      default:
        console.warn(`알 수 없는 상태: ${status}`);
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };


  /**
   * 타입별 색상 반환
   */
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'bug':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      case 'feature':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'improvement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      case 'research':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200';
      default:
        console.warn(`알 수 없는 타입: ${type}`);
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  /**
   * 상태 텍스트 변환
   */
  const getStatusText = (status: string) => {
    switch(status){
      case 'todo':
        return '할 일';
      case 'in_progress':
        return '진행 중';
      case 'in_review':
        return '검토 중';
      case 'done':
        return '완료';
      default:
        console.warn(`알 수 없는 상태: ${status}`);
        return '알 수 없음';
    }
  };

  /**
   * 우선순위 텍스트 변환
   */
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return '낮음';
      case 'medium':
        return '보통';
      case 'high':
        return '높음';
      case 'critical':
        return '긴급';
      default:
        return '알 수 없음';
    }
  };

  /**
   * 타입 텍스트 변환
   */
  const getTypeText = (type: string) => {
    switch (type) {
      case 'task':
        return '작업';
      case 'bug':
        return '버그';
      case 'feature':
        return '기능';
      case 'improvement':
        return '개선';
      case 'research':
        return '연구';
      default:
        return '알 수 없음';
    }
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * 상대적 시간 계산
   */
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return '오늘';
    if (diffInDays === 1) return '어제';
    if (diffInDays < 7) return `${diffInDays}일 전`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}주 전`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}개월 전`;
    return `${Math.floor(diffInDays / 365)}년 전`;
  };

  /**
   * 마감일까지 남은 일수 계산
   */
  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}일 지연`, color: 'text-red-600' };
    if (diffDays === 0) return { text: '오늘 마감', color: 'text-orange-600' };
    if (diffDays === 1) return { text: '내일 마감', color: 'text-yellow-600' };
    return { text: `${diffDays}일 남음`, color: 'text-gray-600' };
  };

  /**
   * 다음 상태 반환
   */
  const getNextStatus = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'todo':
        return 'in_progress';
      case 'in_progress':
        return 'in_review';
      case 'in_review':
        return 'done';
      case 'done':
        return ''; // 완료 상태에서는 다음 상태가 없음
      default:
        // 잘못된 상태일 경우 null 반환
        console.warn(`알 수 없는 상태: ${currentStatus}`);
        return '';
    }
  };

  /**
   * 이전 상태 반환
   */
  const getPreviousStatus = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'todo':
        return '';
      case 'in_progress':
        return 'todo';
      case 'in_review':
        return 'in_progress';
      case 'done':
        return 'in_review';
      default:
        // 잘못된 상태일 경우 null 반환
        console.warn(`알 수 없는 상태: ${currentStatus}`);
        return '';
    }
  };


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

  const nextStatus = getNextStatus(task.status);
  const previousStatus = getPreviousStatus(task.status);
  const dueInfo = task.due_date ? getDaysUntilDue(task.due_date) : null;

  /**
   * 우선순위별 색상 반환
   */
  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
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
              {task.title}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                {getPriorityText(task.priority)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(task.type)}`}>
                {getTypeText(task.type)}
              </span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center space-x-2">
          {/* 상태 변경 버튼 */}
          {canEdit && (
            <div className="flex items-center space-x-1">
              {previousStatus && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(previousStatus)}
                  disabled={statusLoading}
                >
                  ← {getStatusText(previousStatus)}
                </Button>
              )}
              {nextStatus && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={statusLoading}
                  className="flex items-center space-x-1"
                >
                  {statusLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                  <span>{getStatusText(nextStatus)}</span>
                </Button>
              )}
            </div>
          )}

          {canEdit && (
            <Button
              variant="outline"
              onClick={() => navigate(`/tasks/${task.id}/edit`)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              수정
            </Button>
          )}

          {isCreator && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              삭제
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 작업 설명 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              작업 설명
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>
          </Card>

          {/* 하위 작업 */}
          {task.subtasks && task.subtasks.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  하위 작업 ({task.subtasks.length}개)
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/tasks/create?parent_id=${task.id}`)}
                >
                  하위 작업 추가
                </Button>
              </div>

              <div className="space-y-3">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => navigate(`/tasks/${subtask.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon
                        className={`h-5 w-5 ${
                          subtask.status === 'done'
                            ? 'text-green-500'
                            : 'text-gray-400'
                        }`}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {subtask.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(subtask.status)}`}>
                            {getStatusText(subtask.status)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(subtask.priority)}`}>
                            {getPriorityText(subtask.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 댓글 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                댓글 ({task.comments_count}개)
              </h2>
            </div>

            {task.comments && task.comments.length > 0 ? (
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    {comment.user.avatar_url ? (
                      <img
                        src={comment.user.avatar_url}
                        alt={comment.user.full_name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {comment.user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.user.full_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(comment.created_at)}
                          </span>
                          {comment.is_edited && (
                            <span className="text-xs text-gray-400">(수정됨)</span>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  아직 댓글이 없습니다
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 작업 정보 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              작업 정보
            </h3>

            <div className="space-y-4">
              {/* 프로젝트 */}
              <div className="flex items-center space-x-3">
                <DocumentIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">프로젝트</p>
                  <button
                    onClick={() => navigate(`/projects/${task.project.id}`)}
                    className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {task.project.name}
                  </button>
                </div>
              </div>

              {/* 생성자 */}
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">생성자</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {task.creator.full_name}
                  </p>
                </div>
              </div>

              {/* 마감일 */}
              {task.due_date && (
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">마감일</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(task.due_date).split(' ')[0]}
                      </p>
                      {dueInfo && (
                        <span className={`text-sm ${dueInfo.color}`}>
                          ({dueInfo.text})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 예상/실제 시간 */}
              {(task.estimated_hours || task.actual_hours) && (
                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">작업 시간</p>
                    <div className="text-sm">
                      {task.estimated_hours && (
                        <span className="text-gray-600 dark:text-gray-400">
                          예상: {task.estimated_hours}h
                        </span>
                      )}
                      {task.estimated_hours && task.actual_hours && (
                        <span className="mx-1">•</span>
                      )}
                      {task.actual_hours && (
                        <span className="text-gray-900 dark:text-white font-medium">
                          실제: {task.actual_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 생성일 */}
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">생성일</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(task.created_at)}
                  </p>
                </div>
              </div>

              {/* 최근 수정 */}
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">최근 수정</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getRelativeTime(task.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 담당자 */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                담당자 ({task.assignees.length}명)
              </h3>
            </div>

            {task.assignees.length > 0 ? (
              <div className="space-y-3">
                {task.assignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center space-x-3">
                    {assignee.user.avatar_url ? (
                      <img
                        src={assignee.user.avatar_url}
                        alt={assignee.user.full_name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {assignee.user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {assignee.user.full_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {assignee.user.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <UserIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  담당자가 지정되지 않았습니다
                </p>
              </div>
            )}
          </Card>

          {/* 태그 */}
          {task.tags && task.tags.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TagIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  태그
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* 첨부파일 */}
          {task.attachments && task.attachments.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <PaperClipIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  첨부파일 ({task.attachments.length}개)
                </h3>
              </div>
              <div className="space-y-2">
                {task.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <DocumentIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {attachment.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    {attachment.download_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.download_url, '_blank')}
                        className="p-1"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 의존성 */}
          {task.dependencies && task.dependencies.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <LinkIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  의존성
                </h3>
              </div>
              <div className="space-y-2">
                {task.dependencies.map((dependency) => (
                  <div
                    key={dependency.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                    onClick={() => navigate(`/tasks/${dependency.dependency_task.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {dependency.dependency_task.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(dependency.dependency_task.status)}`}>
                          {getStatusText(dependency.dependency_task.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {dependency.dependency_type === 'blocks' && '차단함'}
                          {dependency.dependency_type === 'blocked_by' && '차단됨'}
                          {dependency.dependency_type === 'relates_to' && '관련됨'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              작업 삭제
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              정말로 "<span className="font-medium">{task.title}</span>" 작업을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없으며, 모든 관련 데이터가 영구적으로 삭제됩니다.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteLoading}
              >
                취소
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center space-x-2"
              >
                {deleteLoading && <LoadingSpinner size="sm" />}
                <span>{deleteLoading ? '삭제 중...' : '삭제'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
