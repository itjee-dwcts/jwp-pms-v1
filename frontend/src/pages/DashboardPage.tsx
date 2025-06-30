import {
    ChartBarIcon,
    CheckSquareIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    FolderIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { format, isBefore, parseISO, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from 'recharts';

import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { DashboardStats, Project, Task } from '../types';

// 통계 카드 컴포넌트
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <Card hover>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {value.toLocaleString()}
            </p>
            {trend && (
              <p className={`ml-2 text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// 작업 우선순위별 색상
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'primary';
    case 'low': return 'success';
    default: return 'default';
  }
};

// 작업 상태별 색상
const getStatusColor = (status: string) => {
  switch (status) {
    case 'done': return 'success';
    case 'in_progress': return 'warning';
    case 'review': return 'primary';
    case 'testing': return 'primary';
    default: return 'default';
  }
};

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // 차트 데이터 생성
  const generateChartData = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MM/dd', { locale: ko }),
        fullDate: format(date, 'yyyy-MM-dd'),
        tasks: Math.floor(Math.random() * 10) + 5,
        completed: Math.floor(Math.random() * 8) + 2,
      };
    });
    return days;
  };

  const projectStatusData = [
    { name: '진행중', value: stats?.active_projects || 0, color: '#3B82F6' },
    { name: '완료', value: stats?.completed_projects || 0, color: '#10B981' },
    { name: '계획', value: (stats?.total_projects || 0) - (stats?.active_projects || 0) - (stats?.completed_projects || 0), color: '#6B7280' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 대시보드 통계 가져오기
        const statsResponse = await apiClient.getDashboardStats();
        setStats(statsResponse.data);

        // 최근 작업 가져오기
        const tasksResponse = await apiClient.getTasks({
          page: 1,
          size: 5,
          sort: 'created_at',
          order: 'desc',
        });
        setRecentTasks(tasksResponse.items);

        // 최근 프로젝트 가져오기
        const projectsResponse = await apiClient.getProjects({
          page: 1,
          size: 5,
          sort: 'created_at',
          order: 'desc',
        });
        setRecentProjects(projectsResponse.items);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <PageHeader
        title={`안녕하세요, ${user?.first_name}님!`}
        description="프로젝트 진행 상황을 한눈에 확인해보세요."
        actions={
          <Button
            variant="primary"
            onClick={() => window.location.href = '/projects/new'}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            새 프로젝트
          </Button>
        }
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="전체 프로젝트"
          value={stats?.total_projects || 0}
          icon={FolderIcon}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="진행중인 작업"
          value={stats?.assigned_tasks || 0}
          icon={CheckSquareIcon}
          color="yellow"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="완료된 작업"
          value={stats?.completed_tasks || 0}
          icon={CheckSquareIcon}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="지연된 작업"
          value={stats?.overdue_tasks || 0}
          icon={ExclamationTriangleIcon}
          color="red"
          trend={{ value: -5, isPositive: false }}
        />
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 작업 완료 추이 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              작업 완료 추이
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="완료된 작업"
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="전체 작업"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 프로젝트 상태 분포 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              프로젝트 상태 분포
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 최근 활동 및 마감 예정 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 작업 */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                최근 작업
              </h3>
              <Link
                to="/tasks"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                전체 보기
              </Link>
            </div>

            <div className="space-y-3">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 truncate block"
                      >
                        {task.title}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {task.project.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant={getPriorityColor(task.priority)} size="sm">
                        {task.priority}
                      </Badge>
                      <Badge variant={getStatusColor(task.status)} size="sm">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  최근 작업이 없습니다.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* 마감 예정 작업 */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                마감 예정 작업
              </h3>
              <Link
                to="/tasks?filter=upcoming"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                전체 보기
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.upcoming_deadlines && stats.upcoming_deadlines.length > 0 ? (
                stats.upcoming_deadlines.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 truncate block"
                      >
                        {task.title}
                      </Link>
                      <div className="flex items-center mt-1">
                        <ClockIcon className="h-3 w-3 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {task.due_date && format(parseISO(task.due_date), 'MM월 dd일', { locale: ko })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        task.due_date && isBefore(parseISO(task.due_date), new Date())
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {task.due_date && isBefore(parseISO(task.due_date), new Date()) ? '지연' : '예정'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  마감 예정인 작업이 없습니다.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            빠른 액션
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/projects/new">
              <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors cursor-pointer">
                <FolderIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  새 프로젝트
                </span>
              </div>
            </Link>

            <Link to="/tasks/new">
              <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors cursor-pointer">
                <CheckSquareIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  새 작업
                </span>
              </div>
            </Link>

            <Link to="/calendar">
              <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors cursor-pointer">
                <ClockIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  일정 확인
                </span>
              </div>
            </Link>

            <Link to="/reports">
              <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors cursor-pointer">
                <ChartBarIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  리포트 보기
                </span>
              </div>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
