import { gql, useMutation, useQuery } from '@apollo/client';
import { ArrowBack, Delete, Edit, Person } from '@mui/icons-material';
import {
    Alert,
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Typography
} from '@mui/material';
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// GraphQL 쿼리는 별도의 파일(e.g., src/graphql/users.ts)에서 관리하는 것이 좋습니다.
const GET_USER_DETAIL = gql`
  query GetUserDetail($id: ID!) {
    user(id: $id) {
      id
      name
      email
      role
      avatarUrl
      assignedTasks {
        id
        title
        status
      }
      projects {
        id
        name
      }
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      id
    }
  }
`;

// 타입 정의
interface Task {
  id: string;
  title: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  avatarUrl?: string;
  assignedTasks: Task[];
  projects: Project[];
}

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery<{ user: User }>(GET_USER_DETAIL, {
    variables: { id: userId },
  });

  const [deleteUser, { loading: deleteLoading }] = useMutation(DELETE_USER, {
    onCompleted: () => {
      navigate('/users'); // 삭제 후 사용자 목록으로 이동
    },
    refetchQueries: ['GetUsers'], // 사용자 목록 쿼리 갱신
    onError: (err) => {
      alert(`사용자 삭제 중 오류가 발생했습니다: ${err.message}`);
    },
  });

  const handleDelete = () => {
    if (window.confirm('이 사용자를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      deleteUser({ variables: { id: userId } });
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">사용자 정보를 불러오는 중 오류가 발생했습니다: {error.message}</Alert>;
  if (!data || !data.user) return <Alert severity="warning">사용자를 찾을 수 없습니다.</Alert>;

  const { user } = data;

  const getRoleChipColor = (role: string) => {
    if (role === 'ADMIN') return 'secondary';
    if (role === 'MANAGER') return 'primary';
    return 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>사용자 상세 정보</Typography>
        <Box>
          <IconButton onClick={() => navigate(-1)} aria-label="뒤로 가기"><ArrowBack /></IconButton>
          <IconButton component={Link} to={`/users/edit/${user.id}`} color="primary" aria-label="사용자 수정"><Edit /></IconButton>
          <IconButton onClick={handleDelete} color="error" aria-label="사용자 삭제" disabled={deleteLoading}><Delete /></IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar src={user.avatarUrl} sx={{ width: 100, height: 100, mb: 2 }}>
                {!user.avatarUrl && <Person sx={{ fontSize: 60 }} />}
              </Avatar>
              <Typography variant="h5">{user.name}</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>{user.email}</Typography>
              <Chip label={user.role} color={getRoleChipColor(user.role)} size="small" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>담당 태스크</Typography>
              <List dense>
                {user.assignedTasks.length > 0 ? user.assignedTasks.map(task => (
                  <ListItem key={task.id} component={Link} to={`/tasks/${task.id}`} button>
                    <ListItemText primary={task.title} secondary={`상태: ${task.status}`} />
                  </ListItem>
                )) : <ListItem><ListItemText primary="담당 태스크가 없습니다." /></ListItem>}
              </List>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>참여 프로젝트</Typography>
              <List dense>
                {user.projects.length > 0 ? user.projects.map(project => (
                  <ListItem key={project.id} component={Link} to={`/projects/${project.id}`} button>
                    <ListItemText primary={project.name} />
                  </ListItem>
                )) : <ListItem><ListItemText primary="참여 중인 프로젝트가 없습니다." /></ListItem>}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDetail;
