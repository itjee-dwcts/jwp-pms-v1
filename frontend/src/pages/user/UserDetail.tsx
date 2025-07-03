// src/pages/user/UserDetail.tsx
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Tabs from '../../components/ui/Tabs';
import Textarea from '../../components/ui/Textarea';
import { useAuth } from '../../hooks/use-auth';
import { useUsers } from '../../hooks/use-users';
import { Project, ProjectStatus } from '../../types/project';
import { Task } from '../../types/task';
import { User, UserUpdateRequest } from '../../types/user';

/**
 * 사용자 상세 페이지 컴포넌트
 * 특정 사용자의 상세 정보를 보여주고 관리할 수 있는 페이지
 */
const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isLoading } = useAuth();
  const { getUserById, updateUser, deleteUser } = useUsers();

  // 상태 관리
  const [user, setUser] = useState<User | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // 편집 폼 상태
  const [editForm, setEditForm] = useState<UserUpdateRequest>({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    role: 'VIEWER',
    is_active: true,
  });

  /**
   * 사용자 데이터 로드
   */
  useEffect(() => {
    const loadUserData = async () => {
      if (!id) return;

      try {
        const userData = await getUserById(id);
        setUser(userData);

        // 편집 폼 초기화
        setEditForm({
          full_name: userData.full_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          location: userData.location || '',
          website: userData.website || '',
          role: userData.role,
          is_active: userData.is_active,
        });

        // TODO: 사용자의 프로젝트 및 작업 데이터 로드
        // setUserProjects(await getProjectsByUserId(id));
        // setUserTasks(await getTasksByUserId(id));
      } catch (error) {
        toast.error('사용자 정보를 불러오는데 실패했습니다.');
        console.error('User data loading error:', error);
        navigate('/users');
      }
    };

    loadUserData();
  }, [id, getUserById, navigate]);

  /**
   * 사용자 정보 업데이트 처리
   */
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    try {
      const updatedUser = await updateUser(user.id, editForm);
      setUser(updatedUser);
      setIsEditModalOpen(false);
      toast.success('사용자 정보가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      toast.error('사용자 정보 업데이트에 실패했습니다.');
      console.error('User update error:', error);
    }
  };

  /**
   * 사용자 삭제 처리
   */
  const handleDeleteUser = async () => {
    if (!user?.id) return;

    try {
      await deleteUser(user.id);
      toast.success('사용자가 성공적으로 삭제되었습니다.');
      navigate('/users');
    } catch (error) {
      toast.error('사용자 삭제에 실패했습니다.');
      console.error('User delete error:', error);
    }
  };

  /**
   * 편집 폼 필드 업데이트
   */
  const updateEditField = (field: keyof UserUpdateRequest, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 권한 확인 - 현재 사용자가 해당 사용자를 편집/삭제할 수 있는지 확인
   */
  const canManageUser = () => {
    if (!currentUser || !user) return false;
    return currentUser.role === 'ADMIN' || currentUser.id === user.id;
  };

  /**
   * 관리자 권한 확인
   */
  const isAdmin = () => {
    return currentUser?.role === 'ADMIN';
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '개요', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'projects', label: '프로젝트', icon: <FolderIcon className="w-4 h-4" /> },
    { id: 'tasks', label: '작업', icon: <CheckCircleIcon className="w-4 h-4" /> },
    { id: 'activity', label: '활동', icon: <ClockIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/users')}
            icon={<ArrowLeftIcon className="w-4 h-4" />}
          >
            뒤로
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <Avatar
              src={user.avatar_url ?? null}
              alt={user.full_name || user.email}
              size="2xl"
            />

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.full_name || user.email}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {user.email}
              </p>

              <div className="flex items-center space-x-3 mt-3">
                <Badge
                  variant={user.role === 'ADMIN' ? 'success' : 'primary'}
                >
                  {user.role}
                </Badge>
                <Badge
                  variant={user.is_active ? 'success' : 'danger'}
                >
                  {user.is_active ? '활성' : '비활성'}
                </Badge>
                {user.last_login && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    마지막 로그인: {new Date(user.last_login).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          {canManageUser() && (
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                icon={<PencilIcon className="w-4 h-4" />}
              >
                편집
              </Button>

              {isAdmin() && user.id !== currentUser?.id && (
                <Button
                  variant="danger"
                  onClick={() => setIsDeleteModalOpen(true)}
                  icon={<TrashIcon className="w-4 h-4" />}
                >
                  삭제
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* 탭 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                기본 정보
              </h2>

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

                  <div className="flex items-center space-x-3">
                    <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">권한</p>
                      <Badge variant={user.role === 'ADMIN' ? 'success' : 'primary'}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {user.bio && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">소개</p>
                  <p className="text-gray-900 dark:text-white">{user.bio}</p>
                </div>
              )}

              {user.website && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">웹사이트</p>
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {user.website}
                  </a>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'projects' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                참여 프로젝트
              </h2>

              {userProjects.length > 0 ? (
                <div className="space-y-4">
                  {userProjects.map((project) => (
                    <div
                      key={project.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {project.description}
                          </p>
                        </div>
                        <Badge variant={project.status === ProjectStatus.COMPLETED ? 'success' : 'primary'}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    참여 중인 프로젝트가 없습니다.
                  </p>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'tasks' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                할당된 작업
              </h2>

              {userTasks.length > 0 ? (
                <div className="space-y-4">
                  {userTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {task.description}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-gray-400 mt-2">
                              마감일: {new Date(task.due_date).toLocaleDateString('ko-KR')}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant={task.status === 'COMPLETED' ? 'success' : 'primary'}>
                            {task.status}
                          </Badge>
                          <Badge variant={task.priority === 'HIGH' ? 'danger' : 'secondary'}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    할당된 작업이 없습니다.
                  </p>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                최근 활동
              </h2>

              <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  최근 활동이 없습니다.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
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
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-700 dark:text-gray-300">댓글 수</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.comments_count || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* 계정 정보 카드 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              계정 정보
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">계정 상태</p>
                <Badge variant={user.is_active ? 'success' : 'danger'}>
                  {user.is_active ? '활성' : '비활성'}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">가입일</p>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>

              {user.last_login && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">마지막 로그인</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(user.last_login).toLocaleString('ko-KR')}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">권한</p>
                <Badge variant={user.role === 'ADMIN' ? 'success' : 'primary'}>
                  {user.role}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 사용자 편집 모달 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="사용자 편집"
        size="lg"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="이름"
              value={editForm.full_name}
              onChange={(e) => updateEditField('full_name', e.target.value)}
              required
            />
            <Input
              label="이메일"
              type="email"
              value={editForm.email}
              onChange={(e) => updateEditField('email', e.target.value)}
              required
            />
            <Input
              label="전화번호"
              value={editForm.phone || ''}
              onChange={(e) => updateEditField('phone', e.target.value)}
            />
            <Input
              label="위치"
              value={editForm.location || ''}
              onChange={(e) => updateEditField('location', e.target.value)}
            />
          </div>

          <Input
            label="웹사이트"
            value={editForm.website || ''}
            onChange={(e) => updateEditField('website', e.target.value)}
          />

          <Textarea
            label="소개"
            value={editForm.bio || ''}
            onChange={(e) => updateEditField('bio', e.target.value)}
            rows={3}
          />

          {isAdmin() && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="권한"
                value={editForm.role}
                onChange={(e) => updateEditField('role', e.target.value)}
                options={[
                  { value: 'ADMIN', label: '관리자' },
                  { value: 'PROJECT_MANAGER', label: '프로젝트 매니저' },
                  { value: 'DEVELOPER', label: '개발자' },
                  { value: 'VIEWER', label: '뷰어' },
                ]}
              />

              <Select
                label="계정 상태"
                value={editForm.is_active ? 'true' : 'false'}
                onChange={(e) => updateEditField('is_active', e.target.value === 'true')}
                options={[
                  { value: 'true', label: '활성' },
                  { value: 'false', label: '비활성' },
                ]}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
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
      </Modal>

      {/* 사용자 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="사용자 삭제"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                정말로 이 사용자를 삭제하시겠습니까?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              삭제될 사용자:
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {user.full_name || user.email} ({user.email})
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              loading={isLoading}
            >
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetail;
