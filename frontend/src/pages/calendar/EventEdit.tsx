import { gql, useMutation, useQuery } from '@apollo/client';
import { ArrowBack } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    IconButton,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      description
      start
      end
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

interface EventInput {
  title: string;
  description: string;
  start: string;
  end: string;
}

/**
 * ISO 날짜 문자열을 'YYYY-MM-DDTHH:mm' 형식으로 변환합니다.
 * @param isoDateString - ISO 8601 형식의 날짜 문자열
 * @returns datetime-local input에 적합한 형식의 문자열
 */
const formatDateForInput = (isoDateString: string): string => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  // toISOString()은 UTC 기준이므로, 로컬 시간대를 반영하기 위해 수동으로 포맷팅합니다.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const EventEdit: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [formState, setFormState] = useState<EventInput>({
    title: '',
    description: '',
    start: '',
    end: '',
  });

  const { data, loading: queryLoading, error: queryError } = useQuery<{ event: Event }>(GET_EVENT_DETAIL, {
    variables: { id: eventId },
  });

  const [updateEvent, { loading: mutationLoading, error: mutationError }] = useMutation(UPDATE_EVENT, {
    onCompleted: (data) => {
      navigate(`/events/${data.updateEvent.id}`);
    },
    refetchQueries: ['GetEvents', 'GetEventDetail'],
    onError: (error) => {
      console.error("이벤트 수정 오류:", error);
    },
  });

  useEffect(() => {
    if (data?.event) {
      setFormState({
        title: data.event.title,
        description: data.event.description || '',
        start: formatDateForInput(data.event.start),
        end: formatDateForInput(data.event.end),
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEvent({
      variables: {
        id: eventId,
        input: {
          title: formState.title,
          description: formState.description,
          start: new Date(formState.start).toISOString(),
          end: new Date(formState.end).toISOString(),
        },
      },
    });
  };

  if (queryLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (queryError) return <Alert severity="error">이벤트 정보를 불러오는 중 오류가 발생했습니다: {queryError.message}</Alert>;
  if (!data?.event) return <Alert severity="warning">이벤트를 찾을 수 없습니다.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} aria-label="뒤로 가기"><ArrowBack /></IconButton>
        <Typography variant="h4" sx={{ ml: 1 }}>이벤트 수정</Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}><TextField fullWidth label="이벤트 제목" name="title" value={formState.title} onChange={handleChange} required /></Grid>
              <Grid item xs={12}><TextField fullWidth label="설명" name="description" value={formState.description} onChange={handleChange} multiline rows={4} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="시작 일시" name="start" type="datetime-local" value={formState.start} onChange={handleChange} required InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="종료 일시" name="end" type="datetime-local" value={formState.end} onChange={handleChange} required InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12}>{mutationError && <Alert severity="error">이벤트 수정 중 오류가 발생했습니다: {mutationError.message}</Alert>}</Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => navigate(-1)} sx={{ mr: 1 }}>취소</Button>
                <Button type="submit" variant="contained" color="primary" disabled={mutationLoading}>{mutationLoading ? <CircularProgress size={24} /> : '저장'}</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EventEdit;
