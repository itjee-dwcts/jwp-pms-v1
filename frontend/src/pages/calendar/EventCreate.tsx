import { gql, useMutation } from '@apollo/client';
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// GraphQL 쿼리는 별도의 파일(e.g., src/graphql/events.ts)에서 관리하는 것이 좋습니다.
const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      title
      start
      end
    }
  }
`;

// 폼 상태를 위한 타입 정의
interface EventInput {
  title: string;
  description: string;
  start: string;
  end: string;
}

const EventCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<EventInput>({
    title: '',
    description: '',
    start: '',
    end: '',
  });

  const [createEvent, { loading, error }] = useMutation(CREATE_EVENT, {
    onCompleted: (data) => {
      // 성공 시 생성된 이벤트의 상세 페이지로 이동
      navigate(`/events/${data.createEvent.id}`);
    },
    refetchQueries: ['GetEvents'], // 캘린더의 이벤트 목록을 다시 불러옴
    onError: (error) => {
      console.error("이벤트 생성 오류:", error);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.start || !formState.end) {
      alert("제목, 시작 일시, 종료 일시는 필수 항목입니다.");
      return;
    }
    createEvent({
      variables: {
        input: {
          title: formState.title,
          description: formState.description,
          start: new Date(formState.start).toISOString(),
          end: new Date(formState.end).toISOString(),
        },
      },
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} aria-label="뒤로 가기">
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 1 }}>
          새 이벤트 생성
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField fullWidth label="이벤트 제목" name="title" value={formState.title} onChange={handleChange} required variant="outlined" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="설명" name="description" value={formState.description} onChange={handleChange} multiline rows={4} variant="outlined" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="시작 일시"
                  name="start"
                  type="datetime-local"
                  value={formState.start}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="종료 일시"
                  name="end"
                  type="datetime-local"
                  value={formState.end}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>{error && <Alert severity="error">이벤트 생성 중 오류가 발생했습니다: {error.message}</Alert>}</Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => navigate(-1)} sx={{ mr: 1 }}>취소</Button>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>{loading ? <CircularProgress size={24} /> : '이벤트 생성'}</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EventCreate;
