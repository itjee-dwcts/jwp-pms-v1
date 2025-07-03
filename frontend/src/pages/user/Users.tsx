// src/pages/user/Users.tsx
import {
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import { useAuth } from '../../hooks/use-auth';
import { useUsers } from '../../hooks/use-users';
import { User, UserFilters } from '../../types/user';

/**
 * 사용자 목록 페이지 컴포넌트
 * 전체 사용자 목록을 보여주고 관리할 수 있는 페이지
 */
const Users: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const {
    users,
    getUsers,
    deleteUser,
    updateUser,
    isLoading,
    pagination
  } = useUsers();

  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<UserFilters>({
    role: undefined,
    is_active: undefined,
    created_after: undefined,
    created_before: undefined,
  });
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  /**
   * 사용자 목록 로드
   */
  useEffect(() => {
    const loadUsers = async () => {
      try {
        await getUsers({
          page: currentPage,
          size: pageSize,
          search: searchQuery,
          ...filters,
          sort_by: sortBy,
          sort_order: sortOrder,
        });
      } catch (error) {
        toast.error('사용자 목록을 불러오는데 실패했습니다.');
        console.error('Users loading error:', error);
      }
    };

    loadUsers();
  }, [currentPage, pageSize, searchQuery, filters, sortBy, sortOrder, getUsers]);

  /**
   * 검색 처리
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  /**
   * 필터 업데이트
   */
  const updateFilter = (key: keyof UserFilters, value: any) => {
    setFilters((prev: UserFilters): UserFilters => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  /**
   * 정렬 처리
   */
  const handleSort = (field: 'name' | 'email' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  /**
   * 사용자 선택 처리
   */
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  /**
   * 전체 선택/해제
   */
  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  /**
   * 사용자 삭제 처리
   */
  const handleDeleteUser = async (user: User) => {
    try {
      await deleteUser(user.id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      toast.success('사용자가 성공적으로 삭제되었습니다.');
    } catch (error) {
      toast.error('사용자 삭제에 실패했습니다.');
      console.error('User delete error:', error);
    }
  };

  /**
   * 사용자 상태 토글
   */
  const handleToggleUserStatus = async (user: User) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      toast.success(`사용자가 ${user.is_active ? '비활성화' : '활성화'}되었습니다.`);
    } catch (error) {
      toast.error('사용자 상태 변경에 실패했습니다.');
      console.error('User status toggle error:', error);
    }
  };

  /**
   * 필터 초기화
   */
  const resetFilters = () => {
    setFilters({
      role: undefined,
      is_active: undefined,
      created_after: undefined,
      created_before: undefined,
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  /**
   * 권한 확인
   */
  const canManageUsers = () => {
    return currentUser?.role === 'ADMIN';
  };

  /**
   * 필터링된 사용자 목록
   */
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [users, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            사용자 관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            시스템 사용자를 관리하고 권한을 설정하세요.
          </p>
        </div>

        {canManageUsers() && (
          <Button
            onClick={() => navigate('/users/create')}
            icon={<PlusIcon className="w-5 h-5" />}
          >
            사용자 초대
          </Button>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">전체 사용자</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pagination?.total || 0}
              </p>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">활성 사용자</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(user => user.is_active).length}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">관리자</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(user => user.role === 'ADMIN').length}
              </p>
            </div>
            <UserIcon className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">이번 달 가입</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(user => {
                  const now = new Date();
                  const userDate = new Date(user.created_at);
                  return userDate.getMonth() === now.getMonth() &&
                         userDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <CalendarIcon className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* 검색 */}
          <div className="flex-1 max-w-lg">
            <Input
              placeholder="사용자 이름 또는 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              icon={<MagnifyingGlassIcon className="w-5 h-5" />}
            />
          </div>

          {/* 필터 및 정렬 버튼 */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<FunnelIcon className="w-4 h-4" />}
            >
              필터 {Object.values(filters).some(v => v !== undefined) && '(활성)'}
            </Button>

            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'name' | 'email' | 'created_at');
                setSortOrder(order as 'asc' | 'desc');
              }}
              options={[
                { value: 'created_at-desc', label: '최신순' },
                { value: 'created_at-asc', label: '오래된순' },
                { value: 'name-asc', label: '이름순' },
                { value: 'name-desc', label: '이름 역순' },
                { value: 'email-asc', label: '이메일순' },
                { value: 'email-desc', label: '이메일 역순' },
              ]}
              className="w-40"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageSize(pageSize === 20 ? 50 : pageSize === 50 ? 100 : 20)}
              icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
            >
              {pageSize}개씩
            </Button>
          </div>
        </div>

        {/* 고급 필터 */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Select
                label="권한"
                value={filters.role || ''}
                onChange={(e) => updateFilter('role', e.target.value || undefined)}
                options={[
                  { value: '', label: '모든 권한' },
                  { value: 'ADMIN', label: '관리자' },
                  { value: 'PROJECT_MANAGER', label: '프로젝트 매니저' },
                  { value: 'DEVELOPER', label: '개발자' },
                  { value: 'VIEWER', label: '뷰어' },
                ]}
              />

              <Select
                label="상태"
                value={filters.is_active !== undefined ? String(filters.is_active) : ''}
                onChange={(e) => updateFilter('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
                options={[
                  { value: '', label: '모든 상태' },
                  { value: 'true', label: '활성' },
                  { value: 'false', label: '비활성' },
                ]}
              />

              <Input
                label="가입일 시작"
                type="date"
                value={filters.created_after || ''}
                onChange={(e) => updateFilter('created_after', e.target.value || undefined)}
              />

              <Input
                label="가입일 종료"
                type="date"
                value={filters.created_before || ''}
                onChange={(e) => updateFilter('created_before', e.target.value || undefined)}
              />

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  필터 초기화
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 사용자 목록 */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-12 h-12" />}
            title="사용자가 없습니다"
            description="검색 조건에 맞는 사용자가 없습니다."
            action={
              searchQuery || Object.values(filters).some(v => v !== undefined) ? (
                <Button variant="outline" onClick={resetFilters}>
                  필터 초기화
                </Button>
              ) : canManageUsers() ? (
                <Button onClick={() => navigate('/users/create')}>
                  첫 번째 사용자 초대
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* 테이블 헤더 */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {canManageUsers() && (
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedUsers.length > 0 ? `${selectedUsers.length}개 선택됨` : `총 ${filteredUsers.length}명`}
                  </span>
                </div>

                {selectedUsers.length > 0 && canManageUsers() && (
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      일괄 활성화
                    </Button>
                    <Button size="sm" variant="outline">
                      일괄 비활성화
                    </Button>
                    <Button size="sm" variant="danger">
                      일괄 삭제
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 사용자 목록 */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {canManageUsers() && (
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}

                      <Avatar
                        src={user.avatar_url}
                        alt={user.full_name || user.email}
                        size="md"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {user.full_name || user.email}
                          </h3>
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
                        </div>

                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <EnvelopeIcon className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>

                          {user.phone && (
                            <div className="flex items-center space-x-1">
                              <PhoneIcon className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}

                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>가입: {new Date(user.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>

                          {user.last_login && (
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-4 h-4" />
                              <span>
                                마지막 로그인: {new Date(user.last_login).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/users/${user.id}`)}
                        icon={<EyeIcon className="w-4 h-4" />}
                      >
                        보기
                      </Button>

                      {canManageUsers() && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/users/${user.id}/edit`)}
                            icon={<PencilIcon className="w-4 h-4" />}
                          >
                            편집
                          </Button>

                          <Button
                            size="sm"
                            variant={user.is_active ? "outline" : "primary"}
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            {user.is_active ? (
                              <XCircleIcon className="w-4 h-4" />
                            ) : (
                              <CheckCircleIcon className="w-4 h-4" />
                            )}
                          </Button>

                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setUserToDelete(user);
                                setIsDeleteModalOpen(true);
                              }}
                              icon={<TrashIcon className="w-4 h-4" />}
                            >
                              삭제
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* 사용자 통계 */}
                  <div className="mt-3 flex items-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <FolderIcon className="w-3 h-3" />
                      <span>프로젝트 {user.project_count || 0}개</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="w-3 h-3" />
                      <span>완료 작업 {user.completed_tasks_count || 0}개</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3" />
                      <span>진행 작업 {user.active_tasks_count || 0}개</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.pages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={pageSize}
                  totalItems={pagination.total}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* 사용자 삭제 확인 모달 */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete)}
        title="사용자 삭제"
        message={`정말로 "${userToDelete?.full_name || userToDelete?.email}" 사용자를 삭제하시겠습니까?`}
        description="이 작업은 되돌릴 수 없으며, 사용자와 관련된 모든 데이터가 삭제됩니다."
        confirmText="삭제"
        confirmVariant="danger"
        isLoading={isLoading}
      />
    </div>
  );
};

export default Users;
