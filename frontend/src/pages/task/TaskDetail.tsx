import { gql, useMutation, useQuery } from '@apollo/client';
import { ArrowBack, Delete, Edit } from '@mui/icons-material';
import { Alert, Box, Card, CardContent, Chip, CircularProgress, Grid, IconButton, Typography } from '@mui/material';
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// GraphQL 쿼리는 별도의 파일(e.g., src/graphql/tasks.ts)에서 관리하는 것이 일반적입니다.
const GET_TASK_DETAIL = gql`
  query GetTaskDetail($id: ID!) {
    task(id: $id) {
      id
      title
      description
      status
      priority
      dueDate
      project {
        id
        name
      }
      assignee {
        id
        name
      }
    }
  }
`;

const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      id
    }
  }
`;

// 태스크 데이터 타입 정의
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  project: {
    id: string;
    name: string;
  };
  assignee: {
    id: string;
    name: string;
  };
}

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery<{ task: Task }>(GET_TASK_DETAIL, {
    variables: { id: taskId },
  });

  const [deleteTask] = useMutation(DELETE_TASK, {
    onCompleted: () => {
      navigate('/tasks'); // 삭제 후 태스크 목록으로 이동
    },
    refetchQueries: ['GetTasks'], // 태스크 목록 쿼리를 다시 실행하여 UI 갱신
  });

  const handleDelete = () => {
    if (window.confirm('이 태스크를 정말 삭제하시겠습니까?')) {
      deleteTask({ variables: { id: taskId } });
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">오류가 발생했습니다: {error.message}</Alert>;
  if (!data || !data.task) return <Alert severity="warning">태스크를 찾을 수 없습니다.</Alert>;

  const { task } = data;

  const getStatusChipColor = (status: string) => {
    if (status === 'COMPLETED') return 'success';
    if (status === 'IN_PROGRESS') return 'primary';
    return 'warning';
  };

  const getPriorityChipColor = (priority: string) => {
    if (priority === 'HIGH') return 'error';
    if (priority === 'MEDIUM') return 'warning';
    return 'info';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          태스크 상세 정보
        </Typography>
        <Box>
          <IconButton component={Link} to="/tasks" aria-label="뒤로 가기"><ArrowBack /></IconButton>
          <IconButton component={Link} to={`/tasks/edit/${task.id}`} color="primary" aria-label="태스크 수정"><Edit /></IconButton>
          <IconButton onClick={handleDelete} color="error" aria-label="태스크 삭제"><Delete /></IconButton>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>{task.title}</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item><Chip label={task.status} color={getStatusChipColor(task.status)} /></Grid>
            <Grid item><Chip label={`우선순위: ${task.priority}`} color={getPriorityChipColor(task.priority)} /></Grid>
          </Grid>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, mt: 1, whiteSpace: 'pre-wrap' }}>
            {task.description}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">프로젝트</Typography>
              <Typography variant="body1"><Link to={`/projects/${task.project.id}`}>{task.project.name}</Link></Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">담당자</Typography>
              <Typography variant="body1"><Link to={`/users/${task.assignee.id}`}>{task.assignee.name}</Link></Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">마감일</Typography>
              <Typography variant="body1">{new Date(task.dueDate).toLocaleDateString()}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TaskDetail;
