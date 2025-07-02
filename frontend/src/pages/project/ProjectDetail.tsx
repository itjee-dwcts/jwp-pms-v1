import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/use-auth';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { Project } from '@/types/project';
import { Task } from '@/types/task';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentIcon,
  PencilIcon,
  TagIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * 프로젝트 상세 페이지 컴포넌트
 * 특정 프로젝트의 상세 정보와 관련 작업들을 표시합니다.
 */
const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProject, deleteProject } = useProjects();
  const { getTasksByProject } = useTasks();

  // 상태 관리
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (id) {
      fetchProject();
      fetchTasks();
    }
  }, [id]);

  /**
   * 프로젝트 정보 가져오기
   */
  const fetchProject = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const projectData = await getProject(parseInt(id));
      setProject(projectData);
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
      toast.error('프로젝트를 불러오는데 실패했습니다');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 프로젝트 관련 작업 목록 가져오기
   */
  const fetchTasks = async () => {
    if (!id) return;

    try {
      setTasksLoading(true);
      const tasksData = await getTasksByProject(parseInt(id));
      setTasks(tasksData.slice(0, 5)); // 최근 5개 작업만 표시
    } catch (error) {
      console.error('작업 목록 로드 실패:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  /**
   * 프로젝트 삭제 처리
   */
  const handleDelete = async () => {
    if (!project) return;

    try {
      setDeleteLoading(true);
      await deleteProject(project.id);
      toast.success('프로젝트가 삭제되었습니다');
      navigate('/projects');
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
      toast.error('프로젝트 삭제에 실패했습니다');
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  /**
   * 사용자가 프로젝트 소유자인지 확인
   */
  const isOwner = project?.owner.id === user?.id;

  /**
   * 사용자가 프로젝트 멤버인지 확인
   */
  const isMember = project?.members?.some(member => member.id === user?.id) || isOwner;

  /**
   * 상태별 색상 반환
   */
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      planning: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
      on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
      // 작업 상태들
      open: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
      review: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
      done: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return colors[status] || colors.planning;
  };

  /**
   * 우선순위별 색상 반환
   */
  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
      // 작업 우선순위들
      minor: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      major: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
    };
    return colors[priority] || colors.medium;
  };

  /**
   * 상태 텍스트 변환
   */
  const getStatusText = (status: string) => {
    const statusMap = {
      planning: '계획 중',
      active: '진행 중',
      on_hold: '대기',
      completed: '완료',
      cancelled: '취소',
      // 작업 상태들
      open: '열림',
      in_progress: '진행 중',
      review: '검토 중',
      done: '완료',
      closed: '닫힘',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  /**
   * 우선순위 텍스트 변환
   */
  const getPriorityText = (priority: string) => {
    const priorityMap = {
      low: '낮음',
      medium: '보통',
      high: '높음',
      urgent: '긴급',
      // 작업 우선순위들
      minor: '낮음',
      major: '높음',
    };
    return priorityMap[priority as keyof typeof priorityMap] || priority;
  };

  /**
   * 진행률 계산
   */
  const getProgressPercentage = () => {
    if (!project?.task_count) return 0;
    return Math.round((project.completed_tasks_count / project.task_count) * 100);
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  // 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 프로젝트를 찾을 수 없음
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorMessage message="프로젝트를 찾을 수 없습니다" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
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
              {project.name}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {getStatusText(project.status)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority)}`}>
                {getPriorityText(project.priority)}
              </span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        {isMember && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${project.id}/edit`)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              수정
            </Button>
            {isOwner && (
              <Button
                variant="danger"
                onClick={() => setShowDeleteDialog(true)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                삭제
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 프로젝트 설명 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              프로젝트 설명
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {project.description}
            </p>
          </Card>

          {/* 진행률 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                진행률
              </h2>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {getProgressPercentage()}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">전체 작업:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {project.task_count}개
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">완료 작업:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {project.completed_tasks_count}개
                </span>
              </div>
            </div>
          </Card>

          {/* 최근 작업 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                최근 작업
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/projects/${project.id}/tasks`)}
              >
                모든 작업 보기
              </Button>
            </div>

            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {task.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityText(task.priority)}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            마감: {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {task.assigned_to && (
                        <div className="flex items-center space-x-2">
                          {task.assigned_to.avatar_url ? (
                            <img
                              src={task.assigned_to.avatar_url}
                              alt={task.assigned_to.full_name}
                              className="h-6 w-6 rounded-full"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                {task.assigned_to.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {task.assigned_to.full_name}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-gray-400">
                        {getRelativeTime(task.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  아직 작업이 없습니다
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/projects/${project.id}/tasks/create`)}
                >
                  첫 작업 만들기
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 프로젝트 정보 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              프로젝트 정보
            </h3>

            <div className="space-y-4">
              {/* 소유자 */}
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">소유자</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {project.owner.full_name}
                  </p>
                </div>
              </div>

              {/* 시작일 */}
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">시작일</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(project.start_date)}
                  </p>
                </div>
              </div>

              {/* 종료일 */}
              {project.end_date && (
                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">종료일</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(project.end_date)}
                    </p>
                  </div>
                </div>
              )}

              {/* 예산 */}
              {project.budget && (
                <div className="flex items-center space-x-3">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">예산</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ₩{project.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* 생성일 */}
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">생성일</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(project.created_at)}
                  </p>
                </div>
              </div>

              {/* 최근 수정 */}
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">최근 수정</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getRelativeTime(project.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 태그 */}
          {project.tags!==undefined && project.tags.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TagIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  태그
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* 팀원 */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                팀원 ({project.members===undefined?0:project.members.length + 1}명)
              </h3>
            </div>

            <div className="space-y-3">
              {/* 소유자 */}
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                {project.owner!== undefined && project.owner.avatar_url ? (
                  <img
                    src={project.owner.avatar_url}
                    alt={project.owner.full_name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {project.owner.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {project.owner.full_name}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    프로젝트 소유자
                  </p>
                </div>
              </div>

              {/* 팀원들 */}
              {project.members!== undefined && project.members.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  {member.user.avatar_url ? (
                    <img
                      src={member.user.avatar_url}
                      alt={member.user.full_name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {member.user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.user.full_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.role || '팀원'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 팀원 추가 버튼 (소유자만) */}
            {isOwner && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/projects/${project.id}/members`)}
                  className="w-full"
                >
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  팀원 관리
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              프로젝트 삭제
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              정말로 "<span className="font-medium">{project.name}</span>" 프로젝트를 삭제하시겠습니까?
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

export default ProjectDetail;
