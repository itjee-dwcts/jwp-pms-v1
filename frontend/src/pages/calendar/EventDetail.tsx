import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// GraphQL 쿼리는 별도의 파일(e.g., src/graphql/events.ts)에서 관리하는 것이 좋습니다.
const GET_EVENT_DETAIL = gql`
  query GetEventDetail($id: ID!) {
    event(id: $id) {
      id
      title
      description
      start
      end
    }
  }
`;

const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id) {
      id
    }
  }
`;

// 이벤트 데이터 타입 정의
interface Event {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
}

const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery<{ event: Event }>(GET_EVENT_DETAIL, {
    variables: { id: eventId },
  });

  const [deleteEvent, { loading: deleteLoading }] = useMutation(DELETE_EVENT, {
    onCompleted: () => {
      navigate('/calendar'); // 삭제 후 캘린더 페이지로 이동
    },
    refetchQueries: ['GetEvents'], // 캘린더 이벤트 목록 갱신
    onError: (error) => {
      console.error("이벤트 삭제 오류:", error);
      alert(`이벤트 삭제 중 오류가 발생했습니다: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (window.confirm('이 이벤트를 정말 삭제하시겠습니까?')) {
      deleteEvent({ variables: { id: eventId } });
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">오류가 발생했습니다: {error.message}</Alert>;
  if (!data || !data.event) return <Alert severity="warning">이벤트를 찾을 수 없습니다.</Alert>;

  const { event } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          이벤트 상세 정보
        </Typography>
        <Box>
          <IconButton onClick={() => navigate(-1)} aria-label="뒤로 가기"><ArrowBack /></IconButton>
          <IconButton component={Link} to={`/events/edit/${event.id}`} color="primary" aria-label="이벤트 수정"><Edit /></IconButton>
          <IconButton onClick={handleDelete} color="error" aria-label="이벤트 삭제" disabled={deleteLoading}><Delete /></IconButton>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>{event.title}</Typography>

          <Grid container spacing={2} sx={{ my: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">시작</Typography>
              <Typography variant="body1">{new Date(event.start).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">종료</Typography>
              <Typography variant="body1">{new Date(event.end).toLocaleString()}</Typography>
            </Grid>
          </Grid>

          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
            {event.description || '설명이 없습니다.'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EventDetail;
